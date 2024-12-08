// src/utils/dataUtils.js
import { invoke } from '@tauri-apps/api/tauri';
import { save, open } from '@tauri-apps/api/dialog';
import { writeTextFile, readTextFile } from '@tauri-apps/api/fs';

export const exportData = async (data) => {
  try {
    const filePath = await save({
      filters: [{
        name: 'JSON',
        extensions: ['json']
      }],
      defaultPath: 'arkdata-export.json'
    });

    if (filePath) {
      const jsonString = JSON.stringify(data, null, 2);
      await writeTextFile(filePath, jsonString);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Export failed:', error);
    throw new Error(`Export failed: ${error.message}`);
  }
};

export const importData = async () => {
  try {
    const filePath = await open({
      filters: [{
        name: 'JSON',
        extensions: ['json']
      }]
    });

    if (filePath) {
      const content = await readTextFile(filePath);
      const data = JSON.parse(content);
      
      // Validate data structure
      const requiredKeys = ['creatures', 'items', 'engrams', 'beacons', 'colors'];
      const hasAllKeys = requiredKeys.every(key => key in data);
      
      if (!hasAllKeys) {
        throw new Error('Invalid data format: missing required categories');
      }
      
      return data;
    }
    return null;
  } catch (error) {
    console.error('Import failed:', error);
    throw new Error(`Import failed: ${error.message}`);
  }
};

export const createBackup = async (data) => {
  try {
    // Use the new Rust command to create a backup
    const backupFileName = await invoke('create_backup', { data });
    return backupFileName;
  } catch (error) {
    console.error('Backup failed:', error);
    throw new Error(`Backup failed: ${error.message}`);
  }
};