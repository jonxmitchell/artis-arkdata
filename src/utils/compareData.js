// Compare two objects and return their differences
export function compareData(oldData, newData) {
  const changes = {
    added: {},
    removed: {},
    modified: {},
  };

  // Skip these fields in the root level comparison
  const skipFields = ['version', 'last_updated'];

  // Helper function to check if value is an object (and not null)
  const isObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

  // Only process object properties, skip primitive values and arrays
  Object.entries(newData).forEach(([key, value]) => {
    if (skipFields.includes(key)) return;
    if (!isObject(value)) return;

    if (!oldData[key]) {
      changes.added[key] = value;
    } else if (JSON.stringify(oldData[key]) !== JSON.stringify(value)) {
      changes.modified[key] = {
        old: oldData[key],
        new: value,
        changes: compareObjects(oldData[key], value)
      };
    }
  });

  // Check for removed items
  Object.entries(oldData).forEach(([key, value]) => {
    if (skipFields.includes(key)) return;
    if (!isObject(value)) return;
    
    if (!newData[key]) {
      changes.removed[key] = value;
    }
  });

  return changes;
}

// Compare individual objects and identify specific field changes
export function compareObjects(oldObj, newObj) {
  const changes = {};
  const skipFields = ['version', 'last_updated'];
  
  // Helper function to check if value is an object (and not null)
  const isObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

  // Get all unique keys from both objects
  const allKeys = new Set([
    ...Object.keys(oldObj || {}),
    ...Object.keys(newObj || {})
  ]);
  
  for (const key of allKeys) {
    if (skipFields.includes(key)) continue;

    // Handle cases where either value might be undefined
    if (!Object.prototype.hasOwnProperty.call(oldObj, key)) {
      changes[key] = {
        type: 'added',
        value: newObj[key]
      };
    } else if (!Object.prototype.hasOwnProperty.call(newObj, key)) {
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