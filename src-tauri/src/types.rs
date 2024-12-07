use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ArkData {
    pub creatures: HashMap<String, Creature>,
    pub items: HashMap<String, Item>,
    pub engrams: HashMap<String, Engram>,
    pub beacons: HashMap<String, Beacon>,
    pub colors: HashMap<String, Color>,
}

impl Default for ArkData {
    fn default() -> Self {
        Self {
            creatures: HashMap::new(),
            items: HashMap::new(),
            engrams: HashMap::new(),
            beacons: HashMap::new(),
            colors: HashMap::new(),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Creature {
    pub type_name: String,
    pub name: String,
    pub mod_name: String,
    pub entity_id: String,
    pub blueprint: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Item {
    pub type_name: String,
    pub name: String,
    pub mod_name: String,
    pub class_name: String,
    pub blueprint: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Engram {
    pub type_name: String,
    pub name: String,
    pub mod_name: String,
    pub blueprint: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Beacon {
    pub type_name: String,
    pub name: String,
    pub mod_name: String,
    pub class_name: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Color {
    pub type_name: String,
    pub name: String,
    pub color_id: i32,
    pub hex_code: String,
}
