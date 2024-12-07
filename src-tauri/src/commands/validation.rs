use crate::types::*;
use regex::Regex;
use serde_json::Value;

#[tauri::command]
pub async fn validate_entry(category: String, data: Value) -> Result<bool, String> {
    match category.as_str() {
        "creatures" => validate_creature(data),
        "items" => validate_item(data),
        "engrams" => validate_engram(data),
        "beacons" => validate_beacon(data),
        "colors" => validate_color(data),
        _ => Err("Invalid category".to_string()),
    }
}

fn validate_creature(data: Value) -> Result<bool, String> {
    let creature: Creature =
        serde_json::from_value(data).map_err(|e| format!("Invalid creature data: {}", e))?;

    // Validate blueprint format
    if !creature.blueprint.starts_with("Blueprint'/Game/") {
        return Err("Invalid blueprint format".to_string());
    }

    // Validate entity ID format
    if !creature.entity_id.ends_with("_C") {
        return Err("Invalid entity ID format".to_string());
    }

    Ok(true)
}

fn validate_item(data: Value) -> Result<bool, String> {
    let item: Item =
        serde_json::from_value(data).map_err(|e| format!("Invalid item data: {}", e))?;

    // Validate class name format
    if !item.class_name.ends_with("_C") {
        return Err("Invalid class name format".to_string());
    }

    // Validate blueprint format
    if !item.blueprint.starts_with("Blueprint'/Game/") {
        return Err("Invalid blueprint format".to_string());
    }

    Ok(true)
}

fn validate_engram(data: Value) -> Result<bool, String> {
    let engram: Engram =
        serde_json::from_value(data).map_err(|e| format!("Invalid engram data: {}", e))?;

    // Validate blueprint format
    if !engram.blueprint.starts_with("Blueprint'/Game/") {
        return Err("Invalid blueprint format".to_string());
    }

    Ok(true)
}

fn validate_beacon(data: Value) -> Result<bool, String> {
    let beacon: Beacon =
        serde_json::from_value(data).map_err(|e| format!("Invalid beacon data: {}", e))?;

    // Validate class name format
    if !beacon.class_name.ends_with("_C") {
        return Err("Invalid class name format".to_string());
    }

    Ok(true)
}

fn validate_color(data: Value) -> Result<bool, String> {
    let color: Color =
        serde_json::from_value(data).map_err(|e| format!("Invalid color data: {}", e))?;

    // Validate hex code format
    let hex_regex = Regex::new(r"^#[0-9A-Fa-f]{6}$").unwrap();
    if !hex_regex.is_match(&color.hex_code) {
        return Err("Invalid hex code format".to_string());
    }

    Ok(true)
}
