use crate::types::ArkData;
use chrono::Local;
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Runtime};

fn get_app_dir<R: Runtime>(app: &AppHandle<R>) -> PathBuf {
    app.path_resolver()
        .resolve_resource("arkdata")
        .expect("failed to get app data directory")
}

fn ensure_directory(path: &PathBuf) -> std::io::Result<()> {
    if !path.exists() {
        fs::create_dir_all(path)?;
    }
    Ok(())
}

fn get_data_file_path<R: Runtime>(app: &AppHandle<R>) -> PathBuf {
    let app_dir = get_app_dir(app);
    ensure_directory(&app_dir).expect("failed to create app data directory");
    app_dir.join("ArkData.json")
}

fn get_backups_dir<R: Runtime>(app: &AppHandle<R>) -> PathBuf {
    let app_dir = get_app_dir(app);
    let backups_dir = app_dir.join("backups");
    ensure_directory(&backups_dir).expect("failed to create backups directory");
    backups_dir
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
pub async fn create_backup<R: Runtime>(app: AppHandle<R>, data: ArkData) -> Result<String, String> {
    let backups_dir = get_backups_dir(&app);

    // Generate timestamp for the filename
    let timestamp = Local::now().format("%Y%m%d_%H%M%S");
    let filename = format!("arkdata_backup_{}.json", timestamp);
    let backup_path = backups_dir.join(&filename);

    let json = serde_json::to_string_pretty(&data)
        .map_err(|e| format!("Failed to serialize data: {}", e))?;

    fs::write(&backup_path, json).map_err(|e| format!("Failed to write backup file: {}", e))?;

    Ok(filename)
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
