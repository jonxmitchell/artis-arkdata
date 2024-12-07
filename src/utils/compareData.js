// Compare two objects and return their differences
export function compareData(oldData, newData) {
    const changes = {
      added: {},
      removed: {},
      modified: {},
    };
  
    // Check for added and modified items
    for (const key in newData) {
      if (!(key in oldData)) {
        changes.added[key] = newData[key];
      } else if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
        changes.modified[key] = {
          old: oldData[key],
          new: newData[key],
          changes: compareObjects(oldData[key], newData[key])
        };
      }
    }
  
    // Check for removed items
    for (const key in oldData) {
      if (!(key in newData)) {
        changes.removed[key] = oldData[key];
      }
    }
  
    return changes;
  }
  
  // Compare individual objects and identify specific field changes
  export function compareObjects(oldObj, newObj) {
    const changes = {};
    
    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
    
    for (const key of allKeys) {
      if (!(key in oldObj)) {
        changes[key] = {
          type: 'added',
          value: newObj[key]
        };
      } else if (!(key in newObj)) {
        changes[key] = {
          type: 'removed',
          value: oldObj[key]
        };
      } else if (oldObj[key] !== newObj[key]) {
        changes[key] = {
          type: 'modified',
          oldValue: oldObj[key],
          newValue: newObj[key]
        };
      }
    }
  
    return changes;
  }
  
  // Calculate statistics about the changes
  export function getChangeStats(changes) {
    return {
      added: Object.keys(changes.added).length,
      removed: Object.keys(changes.removed).length,
      modified: Object.keys(changes.modified).length,
      total: Object.keys(changes.added).length + 
             Object.keys(changes.removed).length + 
             Object.keys(changes.modified).length
    };
  }