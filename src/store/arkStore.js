import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event';

const MAX_HISTORY_ENTRIES = 50;

const useArkStore = create((set, get) => ({
  // Core data state
  arkData: {
    creatures: {},
    items: {},
    engrams: {},
    beacons: {},
    colors: {},
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

  // Initialize scraping progress listener
  initScrapingListener: async () => {
    // Ensure we only initialize the listener once
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

  // History management functions
  pushToHistory: (description) => {
    set(state => {
      const newEntry = {
        data: JSON.parse(JSON.stringify(state.arkData)), // Deep clone
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

  undo: async () => {
    if (!get().canUndo()) return;

    set(state => ({
      currentHistoryIndex: state.currentHistoryIndex - 1,
      arkData: JSON.parse(JSON.stringify(state.history[state.currentHistoryIndex - 1].data)),
      lastAction: `Undo: ${state.history[state.currentHistoryIndex].description}`,
      unsavedChanges: true
    }));
  },

  redo: async () => {
    if (!get().canRedo()) return;

    set(state => ({
      currentHistoryIndex: state.currentHistoryIndex + 1,
      arkData: JSON.parse(JSON.stringify(state.history[state.currentHistoryIndex + 1].data)),
      lastAction: `Redo: ${state.history[state.currentHistoryIndex + 1].description}`,
      unsavedChanges: true
    }));
  },

  // Data operations
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

  updateEntry: (category, key, data) => {
    const { pushToHistory } = get();
    
    set(state => ({
      arkData: {
        ...state.arkData,
        [category]: {
          ...state.arkData[category],
          [key]: {
            ...state.arkData[category][key],
            ...data,
          },
        },
      },
    }));

    pushToHistory(`Update ${category} entry: ${key}`);
  },

  // Data loading and saving
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
      const state = get();
      
      await invoke('save_ark_data', { 
        data: state.arkData,
        version: state.currentVersion,
        timestamp: Date.now()
      });

      set({ 
        loading: false,
        lastSaved: Date.now(),
        unsavedChanges: false
      });
    } catch (error) {
      set({ error: error.toString(), loading: false });
    }
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
  
      // Initialize the progress listener if not already done
      const { initScrapingListener } = get();
      await initScrapingListener();
  
      const scrapedData = await invoke('start_scraping');
      
      set({ 
        scraping: false,
        scrapingProgress: {
          stage: 'complete',
          progress: 100,
          message: 'Data collection complete'
        }
      });
  
      return scrapedData; // Return the scraped data instead of automatically merging
  
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
    set({ 
      compareData: newData,
      showComparison: true 
    });
  },

  cancelComparison: () => {
    set({ 
      compareData: null,
      showComparison: false 
    });
  },

  applyComparison: () => {
    const { compareData, pushToHistory } = get();
    if (!compareData) return;

    set(state => ({
      arkData: compareData,
      compareData: null,
      showComparison: false
    }));

    pushToHistory('Applied data comparison changes');
  },

  // Bulk operations
  bulkAddEntries: (category, entries) => {
    const { pushToHistory } = get();
    
    set(state => ({
      arkData: {
        ...state.arkData,
        [category]: {
          ...state.arkData[category],
          ...entries,
        },
      },
    }));

    pushToHistory(`Bulk add to ${category}: ${Object.keys(entries).length} entries`);
  },

  bulkRemoveEntries: (category, keys) => {
    const { pushToHistory } = get();
    
    set(state => {
      const newCategory = { ...state.arkData[category] };
      keys.forEach(key => delete newCategory[key]);
      return {
        arkData: {
          ...state.arkData, 
          [category]: newCategory,
        },
      };
    });

    pushToHistory(`Bulk remove from ${category}: ${keys.length} entries`);
  }
}));

export default useArkStore; 