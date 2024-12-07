#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod scrapers;
mod types;

use commands::*;
use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_context_menu::init())
        .invoke_handler(tauri::generate_handler![
            // Data commands
            load_ark_data,
            save_ark_data,
            export_data,
            import_data,
            // Scraping commands
            start_scraping,
            merge_scraped_data,
            // Validation commands
            validate_entry,
        ])
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let main_window = app.get_window("main").unwrap();
                main_window.open_devtools();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
