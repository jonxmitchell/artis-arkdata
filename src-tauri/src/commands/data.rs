use crate::types::ArkData;
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Runtime};

fn get_data_file_path<R: Runtime>(app: &AppHandle<R>) -> PathBuf {
    // Get the app data directory
    let app_dir = app
        .path_resolver()
        .resolve_resource("arkdata")
        .expect("failed to get app data directory");

    // Create the directory if it doesn't exist
    fs::create_dir_all(&app_dir).expect("failed to create app data directory");

    // Return the full path to arkdata.json
    app_dir.join("ArkData.json")
}

#[tauri::command]
pub async fn load_ark_data<R: Runtime>(app: AppHandle<R>) -> Result<ArkData, String> {
    let data_path = get_data_file_path(&app);

    if !data_path.exists() {
        return Ok(ArkData::default());
    }

    let data =
        fs::read_to_string(&data_path).map_err(|e| format!("Failed to read data file: {}", e))?;

    serde_json::from_str(&data).map_err(|e| format!("Failed to parse JSON: {}", e))
}

#[tauri::command]
pub async fn save_ark_data<R: Runtime>(app: AppHandle<R>, data: ArkData) -> Result<(), String> {
    let data_path = get_data_file_path(&app);

    let json = serde_json::to_string_pretty(&data)
        .map_err(|e| format!("Failed to serialize data: {}", e))?;

    fs::write(&data_path, json).map_err(|e| format!("Failed to write data file: {}", e))
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
