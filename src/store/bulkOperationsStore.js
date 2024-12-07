// src/store/bulkOperationsStore.js
import { create } from 'zustand';
import useArkStore from './arkStore';

const useBulkOperationsStore = create((set, get) => ({
  selectedItems: new Set(),
  category: null,
  
  setCategory: (category) => {
    set({ category, selectedItems: new Set() });
  },

  toggleSelection: (id) => {
    set((state) => {
      const newSelected = new Set(state.selectedItems);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return { selectedItems: newSelected };
    });
  },

  selectAll: (items) => {
    set({ selectedItems: new Set(items) });
  },

  clearSelection: () => {
    set({ selectedItems: new Set() });
  },

  bulkDelete: async () => {
    const { selectedItems, category } = get();
    const { removeEntry } = useArkStore.getState();

    for (const id of selectedItems) {
      await removeEntry(category, id);
    }

    set({ selectedItems: new Set() });
  },

  bulkExport: async () => {
    const { selectedItems, category } = get();
    const { arkData } = useArkStore.getState();
    
    const selectedData = {};
    selectedData[category] = {};

    for (const id of selectedItems) {
      selectedData[category][id] = arkData[category][id];
    }

    return selectedData;
  },
}));

export default useBulkOperationsStore;