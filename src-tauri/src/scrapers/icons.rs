// src-tauri/src/scrapers/icons.rs
use super::progress::ScrapingProgress;
use crate::types::Icon;
use std::collections::HashMap;
use std::fs;
use tauri::{Manager, Window}; // Added Manager trait

pub async fn scrape_icons(
    window: &Window,
    icons: &mut HashMap<String, Icon>,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let app_handle = window.app_handle();
    let resource_path = app_handle
        .path_resolver()
        .resolve_resource("icons.txt")
        .ok_or("Failed to find icons.txt resource")?;

    ScrapingProgress::new("icons", 0.0, "Starting icon data collection...").emit(window);

    let content = fs::read_to_string(resource_path)?;
    let lines: Vec<&str> = content.lines().collect();
    let total_lines = lines.len();

    for (index, line) in lines.iter().enumerate() {
        let progress = (index as f32 / total_lines as f32) * 100.0;

        ScrapingProgress::new(
            "icons",
            progress,
            &format!("Processing icon {} of {}", index + 1, total_lines),
        )
        .emit(window);

        // Extract the icon name from the path
        if let Some(name) = line.split('/').last() {
            if let Some(icon_name) = name.split('.').next() {
                let key = icon_name.to_string();

                icons.insert(
                    key.clone(),
                    Icon {
                        type_name: "icon".to_string(),
                        name: icon_name.to_string(),
                        path: line.to_string(),
                    },
                );
            }
        }
    }

    ScrapingProgress::new(
        "icons",
        100.0,
        &format!("Completed processing {} icons", icons.len()),
    )
    .emit(window);

    Ok(())
}
