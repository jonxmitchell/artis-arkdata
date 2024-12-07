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

    // Execute scraping operations sequentially
    creatures::scrape_creatures(&window, &mut ark_data.creatures).await?;
    items::scrape_items(&window, &mut ark_data.items).await?;
    engrams::scrape_engrams(&window, &mut ark_data.engrams).await?;
    beacons::scrape_beacons(&window, &mut ark_data.beacons).await?;

    Ok(ark_data)
}
