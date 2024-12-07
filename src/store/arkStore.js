import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event';

const MAX_HISTORY_ENTRIES = 50;

const useArkStore = create((set, get) => ({
  // Core data
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

  // Initialize scraping progress listener
  initScrapingListener: async () => {
    await listen('scraping-progress', (event) => {
      set({ scrapingProgress: event.payload });
    });
  },

  // History management functions
  pushToHistory: (description) => {
    set(state => {
      const newEntry = {
        data: JSON.parse(JSON.stringify(state.arkData)), // Deep clone to prevent reference issues
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

      const scrapedData = await invoke('start_scraping');
      const mergedData = await invoke('merge_scraped_data', {
        existingData: get().arkData,
        scrapedData
      });

      const { pushToHistory } = get();
      pushToHistory('Updated data from web scraping');

      set({ 
        arkData: mergedData, 
        scraping: false,
        scrapingProgress: {
          stage: 'complete',
          progress: 100,
          message: 'Data collection complete'
        }
      });

      await get().saveData();
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
    }
  }
}));

export default useArkStore;