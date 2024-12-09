import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event';
import { compareData } from '@/utils/compareData';

const MAX_HISTORY_ENTRIES = 50;

const useArkStore = create((set, get) => ({
  // Core data state
  arkData: {
    creatures: {},
    items: {},
    engrams: {},
    beacons: {},
    colors: {},
    version: "1.0.0",
    last_updated: Date.now()
  },
  currentVersion: 1,
  lastSaved: null,

  // UI state
  loading: false,
  error: null,
  scraping: false,
  scrapingProgress: {
    stage: null,
    progress: 0,
    message: '',
  },

  // History management
  history: [],
  currentHistoryIndex: -1,
  lastAction: null,
  unsavedChanges: false,

  // Comparison state
  compareData: null,
  showComparison: false,
  pendingChanges: {
    creatures: { accept: new Set(), reject: new Set() },
    items: { accept: new Set(), reject: new Set() },
    engrams: { accept: new Set(), reject: new Set() },
    beacons: { accept: new Set(), reject: new Set() },
    colors: { accept: new Set(), reject: new Set() }
  },

  // Initialize scraping progress listener
  initScrapingListener: async () => {
    if (get().listenerInitialized) return;
    
    await listen('scraping-progress', (event) => {
      const progress = event.payload;
      set(state => ({
        scrapingProgress: {
          ...state.scrapingProgress,
          ...progress
        }
      }));
    });
  
    set({ listenerInitialized: true });
  },

  // Version management
  incrementMajorVersion: () => {
    set(state => {
      const [major, minor, patch] = state.arkData.version.split('.').map(Number);
      const newData = {
        ...state.arkData,
        version: `${major + 1}.0.0`,
        last_updated: Date.now()
      };
      return {
        arkData: newData,
        unsavedChanges: true
      };
    });
  },

  incrementMinorVersion: () => {
    set(state => {
      const [major, minor, patch] = state.arkData.version.split('.').map(Number);
      const newData = {
        ...state.arkData,
        version: `${major}.${minor + 1}.0`,
        last_updated: Date.now()
      };
      return {
        arkData: newData,
        unsavedChanges: true
      };
    });
  },

  incrementPatchVersion: () => {
    set(state => {
      const [major, minor, patch] = state.arkData.version.split('.').map(Number);
      const newData = {
        ...state.arkData,
        version: `${major}.${minor}.${patch + 1}`,
        last_updated: Date.now()
      };
      return {
        arkData: newData,
        unsavedChanges: true
      };
    });
  },

  // History management
  pushToHistory: (description) => {
    set(state => {
      const newEntry = {
        data: JSON.parse(JSON.stringify(state.arkData)),
        version: state.currentVersion + 1,
        timestamp: Date.now(),
        description
      };

      const newHistory = state.history.slice(0, state.currentHistoryIndex + 1);
      newHistory.push(newEntry);

      while (newHistory.length > MAX_HISTORY_ENTRIES) {
        newHistory.shift();
      }

      return {
        history: newHistory,
        currentHistoryIndex: newHistory.length - 1,
        currentVersion: state.currentVersion + 1,
        unsavedChanges: true,
        lastAction: description
      };
    });
  },

  canUndo: () => {
    const state = get();
    return state.currentHistoryIndex > 0;
  },

  canRedo: () => {
    const state = get();
    return state.currentHistoryIndex < state.history.length - 1;
  },

  undo: () => {
    if (!get().canUndo()) return;

    set(state => ({
      currentHistoryIndex: state.currentHistoryIndex - 1,
      arkData: JSON.parse(JSON.stringify(state.history[state.currentHistoryIndex - 1].data)),
      lastAction: `Undo: ${state.history[state.currentHistoryIndex].description}`,
      unsavedChanges: true
    }));
  },

  redo: () => {
    if (!get().canRedo()) return;

    set(state => ({
      currentHistoryIndex: state.currentHistoryIndex + 1,
      arkData: JSON.parse(JSON.stringify(state.history[state.currentHistoryIndex + 1].data)),
      lastAction: `Redo: ${state.history[state.currentHistoryIndex + 1].description}`,
      unsavedChanges: true
    }));
  },

  // Data operations
  loadData: async () => {
    try {
      set({ loading: true, error: null });
      const data = await invoke('load_ark_data');
      
      set({ 
        arkData: data,
        currentVersion: 1,
        history: [{
          data: JSON.parse(JSON.stringify(data)),
          version: 1,
          timestamp: Date.now(),
          description: 'Initial load'
        }],
        currentHistoryIndex: 0,
        loading: false,
        lastSaved: Date.now(),
        unsavedChanges: false
      });
    } catch (error) {
      set({ error: error.toString(), loading: false });
    }
  },

  saveData: async () => {
    try {
      set({ loading: true, error: null });
      await invoke('save_ark_data', { data: get().arkData });
      set({ 
        loading: false,
        lastSaved: Date.now(),
        unsavedChanges: false
      });
    } catch (error) {
      set({ error: error.toString(), loading: false });
    }
  },

  // Entry management
  addEntry: (category, key, data) => {
    const { pushToHistory } = get();
    
    set(state => ({
      arkData: {
        ...state.arkData,
        [category]: {
          ...state.arkData[category],
          [key]: data,
        },
      },
    }));

    pushToHistory(`Add ${category} entry: ${key}`);
  },

  removeEntry: (category, key) => {
    const { pushToHistory } = get();
    
    set(state => {
      const newCategory = { ...state.arkData[category] };
      delete newCategory[key];
      return {
        arkData: {
          ...state.arkData,
          [category]: newCategory,
        },
      };
    });

    pushToHistory(`Remove ${category} entry: ${key}`);
  },

  // Scraping operations
  startScraping: async () => {
    try {
      set({ 
        scraping: true, 
        error: null,
        scrapingProgress: {
          stage: 'initializing',
          progress: 0,
          message: 'Starting data collection...'
        }
      });

      await get().initScrapingListener();
      const scrapedData = await invoke('start_scraping');
      
      set({ 
        scraping: false,
        scrapingProgress: {
          stage: 'complete',
          progress: 100,
          message: 'Data collection complete'
        }
      });
  
      return scrapedData;
    } catch (error) {
      set({ 
        error: error.toString(), 
        scraping: false,
        scrapingProgress: {
          stage: 'error',
          progress: 0,
          message: error.toString()
        }
      });
      return null;
    }
  },

  // Comparison operations
  startComparison: (newData) => {
    const { arkData } = get();
    
    const pendingChanges = {
      creatures: { accept: new Set(), reject: new Set() },
      items: { accept: new Set(), reject: new Set() },
      engrams: { accept: new Set(), reject: new Set() },
      beacons: { accept: new Set(), reject: new Set() },
      colors: { accept: new Set(), reject: new Set() }
    };
  
    Object.keys(newData).forEach(category => {
      const oldCategoryData = arkData[category] || {};
      const newCategoryData = newData[category] || {};
      const comparison = compareData(oldCategoryData, newCategoryData);
      
      Object.keys(comparison.modified).forEach(key => {
        pendingChanges[category].accept.add(key);
      });
      
      Object.keys(comparison.added).forEach(key => {
        pendingChanges[category].accept.add(key);
      });
      
      Object.keys(comparison.removed).forEach(key => {
        pendingChanges[category].reject.add(key);
      });
    });
  
    set({ 
      compareData: newData,
      showComparison: true,
      pendingChanges
    });
  },

  cancelComparison: () => {
    set({ 
      compareData: null,
      showComparison: false,
      pendingChanges: {
        creatures: { accept: new Set(), reject: new Set() },
        items: { accept: new Set(), reject: new Set() },
        engrams: { accept: new Set(), reject: new Set() },
        beacons: { accept: new Set(), reject: new Set() },
        colors: { accept: new Set(), reject: new Set() }
      }
    });
  },

  applyComparison: () => {
    const { compareData, pendingChanges, pushToHistory } = get();
    if (!compareData) return;

    set(state => {
      const newData = { ...state.arkData };
      
      // Copy existing version and last_updated or set defaults
      newData.version = state.arkData.version || "1.0.0";
      newData.last_updated = state.arkData.last_updated || Math.floor(Date.now() / 1000);
      
      Object.keys(compareData).forEach(category => {
        if (category === 'version' || category === 'last_updated') return;
        
        newData[category] = { ...newData[category] };
        const categoryPending = pendingChanges[category];

        Object.entries(compareData[category]).forEach(([key, item]) => {
          if (!state.arkData[category]?.[key]) {
            if (categoryPending.accept.has(key)) {
              newData[category][key] = item;
            }
          } else if (JSON.stringify(state.arkData[category][key]) !== JSON.stringify(item)) {
            if (categoryPending.accept.has(key)) {
              newData[category][key] = item;
            } else if (!categoryPending.reject.has(key)) {
              newData[category][key] = state.arkData[category][key];
            }
          } else {
            newData[category][key] = state.arkData[category][key];
          }
        });

        Object.keys(state.arkData[category] || {}).forEach(key => {
          if (!compareData[category]?.[key] && categoryPending.accept.has(key)) {
            delete newData[category][key];
          }
        });
      });

      // Safely increment patch version
      if (newData.version) {
        try {
          const [major, minor, patch] = newData.version.split('.').map(Number);
          if (!isNaN(major) && !isNaN(minor) && !isNaN(patch)) {
            newData.version = `${major}.${minor}.${patch + 1}`;
          }
        } catch (error) {
          console.warn('Failed to increment version number:', error);
          // Keep existing version if increment fails
        }
      }

      // Update timestamp
      newData.last_updated = Math.floor(Date.now() / 1000);

      return {
        arkData: newData,
        compareData: null,
        showComparison: false,
        pendingChanges: {
          creatures: { accept: new Set(), reject: new Set() },
          items: { accept: new Set(), reject: new Set() },
          engrams: { accept: new Set(), reject: new Set() },
          beacons: { accept: new Set(), reject: new Set() },
          colors: { accept: new Set(), reject: new Set() }
        }
      };
    });

    pushToHistory('Applied selective data comparison changes');
  },

  // Change handling
  handleChangeAccept: (category, type, key) => {
    set(state => {
      const newPendingChanges = { ...state.pendingChanges };
      newPendingChanges[category].accept.add(key);
      newPendingChanges[category].reject.delete(key);
      return { pendingChanges: newPendingChanges };
    });
  },

  handleChangeReject: (category, type, key) => {
    set(state => {
      const newPendingChanges = { ...state.pendingChanges };
      newPendingChanges[category].reject.add(key);
      newPendingChanges[category].accept.delete(key);
      return { pendingChanges: newPendingChanges };
    });
  },
}));

export default useArkStore;