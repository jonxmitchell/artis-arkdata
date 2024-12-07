use crate::types::ArkData;
use std::fs;
use tauri::api::path;

#[tauri::command]
pub async fn load_ark_data() -> Result<ArkData, String> {
    let app_dir = path::app_data_dir(&tauri::Config::default())
        .ok_or_else(|| "Failed to get app directory".to_string())?;
    let data_path = app_dir.join("arkdata.json");

    if !data_path.exists() {
        return Ok(ArkData::default());
    }

    let data =
        fs::read_to_string(data_path).map_err(|e| format!("Failed to read data file: {}", e))?;

    serde_json::from_str(&data).map_err(|e| format!("Failed to parse JSON: {}", e))
}

#[tauri::command]
pub async fn save_ark_data(data: ArkData) -> Result<(), String> {
    let app_dir = path::app_data_dir(&tauri::Config::default())
        .ok_or_else(|| "Failed to get app directory".to_string())?;

    if !app_dir.exists() {
        fs::create_dir_all(&app_dir)
            .map_err(|e| format!("Failed to create app directory: {}", e))?;
    }

    let data_path = app_dir.join("arkdata.json");
    let json = serde_json::to_string_pretty(&data)
        .map_err(|e| format!("Failed to serialize data: {}", e))?;

    fs::write(data_path, json).map_err(|e| format!("Failed to write data file: {}", e))
}

#[tauri::command]
pub async fn export_data(data: ArkData, path: String) -> Result<(), String> {
    let json = serde_json::to_string_pretty(&data)
        .map_err(|e| format!("Failed to serialize data: {}", e))?;

    fs::write(path, json).map_err(|e| format!("Failed to write export file: {}", e))
}

#[tauri::command]
pub async fn import_data(path: String) -> Result<ArkData, String> {
    let data =
        fs::read_to_string(path).map_err(|e| format!("Failed to read import file: {}", e))?;

    serde_json::from_str(&data).map_err(|e| format!("Failed to parse import data: {}", e))
}
