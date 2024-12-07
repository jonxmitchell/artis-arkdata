use crate::scrapers;
use crate::types::ArkData;
use std::sync::Arc;
use tauri::Window;

#[tauri::command]
pub async fn start_scraping(window: Window) -> Result<ArkData, String> {
    // Clone the window for use in a spawned task
    let window = Arc::new(window);

    // Spawn the scraping task to ensure proper thread handling
    tokio::task::spawn({
        let window = Arc::clone(&window);
        async move {
            scrapers::scrape_all((*window).clone())
                .await
                .map_err(|e| format!("Failed to scrape data: {}", e))
        }
    })
    .await
    .unwrap_or_else(|e| Err(format!("Task failed: {}", e)))
}

#[tauri::command]
pub async fn merge_scraped_data(
    existing_data: ArkData,
    scraped_data: ArkData,
) -> Result<ArkData, String> {
    let mut merged = existing_data;

    // Merge each category
    for (key, value) in scraped_data.creatures {
        merged.creatures.entry(key).or_insert(value);
    }
    for (key, value) in scraped_data.items {
        merged.items.entry(key).or_insert(value);
    }
    for (key, value) in scraped_data.engrams {
        merged.engrams.entry(key).or_insert(value);
    }
    for (key, value) in scraped_data.beacons {
        merged.beacons.entry(key).or_insert(value);
    }
    for (key, value) in scraped_data.colors {
        merged.colors.entry(key).or_insert(value);
    }

    Ok(merged)
}
