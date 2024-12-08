use super::{common::*, progress::ScrapingProgress};
use crate::types::Color;
use scraper::{Html, Selector};
use std::collections::HashMap;
use tauri::Window;

pub async fn scrape_colors(
    window: &Window,
    colors: &mut HashMap<String, Color>,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let client = ScraperClient::new();
    let url = format!("{}/wiki/Color_IDs", BASE_URL);
    let html = client.fetch_page(&url).await?;
    let document = Html::parse_document(&html);

    // Create selectors for the color data
    let list_selector = Selector::parse("ul.color-ids-list").unwrap();
    let item_selector = Selector::parse("li").unwrap();
    let id_selector = Selector::parse("code.copy-clipboard .copy-content").unwrap();
    let name_selector = Selector::parse(".color-pill.copy-clipboard .copy-content").unwrap();
    let hex_selector = Selector::parse(".color-id-infos code").unwrap();

    // First pass: Count total items across all lists
    let total_items: usize = document
        .select(&list_selector)
        .map(|list| list.select(&item_selector).count())
        .sum();

    // Find all color lists
    let color_lists = document.select(&list_selector);
    let mut processed_colors = 0;

    for list in color_lists {
        let items = list.select(&item_selector);

        for (_index, item) in items.enumerate() {
            // Extract color ID
            let color_id = item
                .select(&id_selector)
                .next()
                .and_then(|el| el.text().collect::<String>().parse::<i32>().ok())
                .unwrap_or(-1);

            // Extract color name and clean it
            let raw_name = item
                .select(&name_selector)
                .next()
                .map(|el| clean_name(&el.text().collect::<String>()))
                .unwrap_or_else(|| format!("Color_{}", color_id));

            // Remove "Coloring" from the name
            let name = raw_name.replace(" Coloring", "");

            // Extract hex code (first code element contains sRGB value)
            let hex_code = item
                .select(&hex_selector)
                .next()
                .map(|el| el.text().collect::<String>())
                .unwrap_or_default();

            if color_id >= 0 {
                processed_colors += 1;

                // Calculate progress based on total items across all lists
                let progress = (processed_colors as f32 / total_items as f32) * 100.0;

                ScrapingProgress::new(
                    "colors",
                    progress.min(100.0), // Ensure progress never exceeds 100%
                    &format!(
                        "Processing color {} of {} ({})",
                        processed_colors, total_items, name
                    ),
                )
                .emit(window);

                // Create the color entry
                let key = name.replace(' ', "_").replace('-', "_");
                colors.insert(
                    key,
                    Color {
                        type_name: "color".to_string(),
                        name,
                        color_id,
                        hex_code,
                    },
                );
            }
        }
    }

    // Final completion message
    ScrapingProgress::new(
        "colors",
        100.0,
        &format!("Completed processing {} colors", colors.len()),
    )
    .emit(window);

    Ok(())
}
