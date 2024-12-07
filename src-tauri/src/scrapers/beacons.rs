use super::{common::*, progress::ScrapingProgress};
use crate::types::Beacon;
use scraper::{Html, Selector};
use std::collections::HashMap;
use std::sync::Arc;
use tauri::Window;

pub async fn scrape_beacons(
    window: &Window,
    beacons: &mut HashMap<String, Beacon>,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let client = ScraperClient::new();
    let url = format!("{}/wiki/Beacon", BASE_URL);
    let html = client.fetch_page(&url).await?;
    let document = Html::parse_document(&html);

    let table_selector = Arc::new(Selector::parse("table.wikitable").unwrap());
    let row_selector = Arc::new(Selector::parse("tr").unwrap());
    let cell_selector = Arc::new(Selector::parse("td").unwrap());
    let heading_selector = Arc::new(Selector::parse("h2, h3").unwrap());

    let tables: Vec<_> = document.select(&table_selector).collect();
    let total_tables = tables.len();
    let headings: Vec<_> = document.select(&heading_selector).collect();

    for (table_idx, table) in tables.iter().enumerate() {
        let rows: Vec<_> = table.select(&row_selector).collect();
        let total_rows = rows.len();

        // Find the appropriate heading for this table by getting the last heading before this table
        let location = headings
            .iter()
            .take_while(|&h| {
                let h_html = h.html();
                let table_html = table.html();
                h_html.as_bytes().as_ptr() < table_html.as_bytes().as_ptr()
            })
            .last()
            .map(|h| clean_name(&h.text().collect::<String>()))
            .unwrap_or_else(|| "Unknown Location".to_string());

        for (row_idx, row) in rows.iter().enumerate().skip(1) {
            let cells: Vec<_> = row.select(&cell_selector).collect();

            if cells.len() >= 2 {
                let progress = ((table_idx as f32 / total_tables as f32)
                    + (row_idx as f32 / total_rows as f32 / total_tables as f32))
                    * 100.0;

                ScrapingProgress::new(
                    "beacons",
                    progress,
                    &format!(
                        "Processing beacon {} of {}",
                        table_idx * total_rows + row_idx,
                        total_tables * total_rows
                    ),
                )
                .emit(window);

                let name = clean_name(&cells[0].text().collect::<String>());

                if !should_skip_beacon(&name) {
                    let class_name = clean_name(&cells[1].text().collect::<String>());
                    let full_name = format!("[{}] {}", location, name);
                    let key = full_name.replace(" ", "_");

                    beacons.insert(
                        key,
                        Beacon {
                            type_name: "beacon".to_string(),
                            name: full_name,
                            mod_name: "Ark".to_string(),
                            class_name,
                        },
                    );
                }
            }
        }
    }

    Ok(())
}

fn should_skip_beacon(name: &str) -> bool {
    let skip_patterns = [
        "Genesis_2_",
        "Genesis_1_Fishing",
        "Choose_Your_Own_Adventure",
        "Team_Downriver_Run",
        "Starwing_Strike",
        "Star_Dolphin",
        "Slipstream_Sweep",
        "Slide_and_Glide",
    ];
    skip_patterns.iter().any(|pattern| name.contains(pattern))
}
