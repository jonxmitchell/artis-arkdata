pub mod beacons;
pub mod common;
pub mod creatures;
pub mod engrams;
pub mod items;
pub mod progress;

use crate::types::ArkData;
use std::collections::HashMap;
use tauri::Window;

pub async fn scrape_all(
    window: Window,
) -> Result<ArkData, Box<dyn std::error::Error + Send + Sync>> {
    let mut ark_data = ArkData {
        creatures: HashMap::new(),
        items: HashMap::new(),
        engrams: HashMap::new(),
        beacons: HashMap::new(),
        colors: HashMap::new(),
    };

    // Track progress stages
    let stages = [
        ("creatures", "Starting creature scraping..."),
        ("items", "Starting item scraping..."),
        ("engrams", "Starting engram scraping..."),
        ("beacons", "Starting beacon scraping..."),
    ];

    let total_stages = stages.len() as f32;

    for (index, (stage, message)) in stages.iter().enumerate() {
        let current_progress = (index as f32 / total_stages) * 100.0;

        // Emit start progress
        progress::emit_progress(&window, stage, current_progress, message);

        // Perform scraping based on stage
        match *stage {
            "creatures" => creatures::scrape_creatures(&window, &mut ark_data.creatures).await?,
            "items" => items::scrape_items(&window, &mut ark_data.items).await?,
            "engrams" => engrams::scrape_engrams(&window, &mut ark_data.engrams).await?,
            "beacons" => beacons::scrape_beacons(&window, &mut ark_data.beacons).await?,
            _ => {}
        }

        // Emit completion for this stage
        let stage_complete_progress = ((index + 1) as f32 / total_stages) * 100.0;
        progress::emit_progress(
            &window,
            stage,
            stage_complete_progress,
            &format!("{} complete", stage),
        );
    }

    // Final completion message
    progress::emit_progress(&window, "complete", 100.0, "Data collection complete");

    Ok(ark_data)
}
