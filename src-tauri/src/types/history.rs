use super::ArkData;
use serde::{Deserialize, Serialize};
use std::time::SystemTime;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct HistoryEntry {
    pub data: ArkData,
    pub version: u32,
    pub timestamp: u64,
    pub description: String,
}

impl HistoryEntry {
    pub fn new(data: ArkData, version: u32, description: String) -> Self {
        let timestamp = SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        Self {
            data,
            version,
            timestamp,
            description,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct History {
    entries: Vec<HistoryEntry>,
    current_index: usize,
    max_entries: usize,
}

impl History {
    pub fn new(max_entries: usize) -> Self {
        Self {
            entries: Vec::new(),
            current_index: 0,
            max_entries,
        }
    }

    pub fn push(&mut self, entry: HistoryEntry) {
        // Remove any future entries if we're not at the end
        if self.current_index < self.entries.len() {
            self.entries.truncate(self.current_index);
        }

        // Add new entry
        self.entries.push(entry);
        self.current_index = self.entries.len();

        // Remove oldest entries if we exceed max_entries
        while self.entries.len() > self.max_entries {
            self.entries.remove(0);
            self.current_index = self.current_index.saturating_sub(1);
        }
    }

    pub fn can_undo(&self) -> bool {
        self.current_index > 0
    }

    pub fn can_redo(&self) -> bool {
        self.current_index < self.entries.len()
    }

    pub fn undo(&mut self) -> Option<&HistoryEntry> {
        if self.can_undo() {
            self.current_index -= 1;
            Some(&self.entries[self.current_index])
        } else {
            None
        }
    }

    pub fn redo(&mut self) -> Option<&HistoryEntry> {
        if self.can_redo() {
            self.current_index += 1;
            Some(&self.entries[self.current_index - 1])
        } else {
            None
        }
    }

    pub fn current(&self) -> Option<&HistoryEntry> {
        if self.current_index > 0 {
            Some(&self.entries[self.current_index - 1])
        } else {
            None
        }
    }
}
