use super::{common::*, progress::ScrapingProgress};
use crate::types::Beacon;
use scraper::{ElementRef, Html, Selector};
use std::collections::HashMap;
use std::sync::Arc;
use tauri::Window;

pub async fn scrape_beacons(
    window: &Window,
    beacons: &mut HashMap<String, Beacon>,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let client = ScraperClient::new();
    let url = format!("{}/wiki/Beacon_IDs", BASE_URL);
    let html = client.fetch_page(&url).await?;
    let document = Html::parse_document(&html);

    let table_selector = Arc::new(Selector::parse("table.wikitable").unwrap());
    let row_selector = Arc::new(Selector::parse("tr").unwrap());
    let cell_selector = Arc::new(Selector::parse("td").unwrap());
    let heading_selector = Arc::new(Selector::parse("h3 .mw-headline").unwrap());

    let tables: Vec<_> = document.select(&table_selector).collect();
    let total_tables = tables.len();

    let mut current_mod = String::from("Ark");

    for (table_idx, table) in tables.iter().enumerate() {
        // Look for the preceding h3 header
        let mut current_element = table.prev_sibling();
        while let Some(element) = current_element {
            if let Some(element_ref) = ElementRef::wrap(element) {
                if element_ref.value().name() == "h3" {
                    if let Some(headline) = element_ref.select(&heading_selector).next() {
                        current_mod = clean_name(&headline.text().collect::<String>());
                    }
                    break;
                }
            }
            current_element = element.prev_sibling();
        }

        let rows: Vec<_> = table.select(&row_selector).collect();
        let total_rows = rows.len();

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
                        "Processing beacon {} of {} ({})",
                        table_idx * total_rows + row_idx,
                        total_tables * total_rows,
                        current_mod
                    ),
                )
                .emit(window);

                let name = clean_name(&cells[0].text().collect::<String>());

                if !should_skip_beacon(&name) {
                    // Split class names by <br> tag or newline
                    let html_content = cells[1].inner_html();
                    let class_names: Vec<String> = html_content
                        .split(|c| c == '\n' || c == '<')
                        .filter(|s| s.contains("_C"))
                        .map(|s| clean_name(s))
                        .collect();

                    for (idx, class_name) in class_names.iter().enumerate() {
                        let suffix = if idx > 0 { " (Double)" } else { "" };
                        let display_name = format!("{}{}", name, suffix);

                        // Create key with mod name prefix
                        let key = format!(
                            "{}_{}",
                            current_mod.replace(" ", "_"),
                            display_name.replace(" ", "_")
                        );

                        beacons.insert(
                            key,
                            Beacon {
                                type_name: "beacon".to_string(),
                                name: display_name,
                                mod_name: current_mod.clone(),
                                class_name: class_name.to_string(),
                            },
                        );
                    }
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
