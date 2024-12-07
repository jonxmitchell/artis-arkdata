use super::{common::*, progress::ScrapingProgress};
use crate::types::Creature;
use scraper::{Html, Selector};
use std::collections::HashMap;
use std::sync::Arc;
use tauri::Window;

pub async fn scrape_creatures(
    window: &Window,
    creatures: &mut HashMap<String, Creature>,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let client = ScraperClient::new();
    let url = format!("{}/wiki/Creature_IDs", BASE_URL);
    let html = client.fetch_page(&url).await?;
    let document = Html::parse_document(&html);

    // Create Arc'd selectors
    let table_selector = Arc::new(Selector::parse("table.wikitable").unwrap());
    let row_selector = Arc::new(Selector::parse("tr").unwrap());
    let cell_selector = Arc::new(Selector::parse("td").unwrap());

    let tables: Vec<_> = document.select(&table_selector).collect();
    let total_tables = tables.len();

    for (table_idx, table) in tables.iter().enumerate() {
        let rows: Vec<_> = table.select(&row_selector).collect();
        let total_rows = rows.len();

        for (row_idx, row) in rows.iter().enumerate().skip(1) {
            let cells: Vec<_> = row.select(&cell_selector).collect();

            if cells.len() >= 4 {
                let progress = ((table_idx as f32 / total_tables as f32)
                    + (row_idx as f32 / total_rows as f32 / total_tables as f32))
                    * 100.0;

                ScrapingProgress::new(
                    "creatures",
                    progress,
                    &format!(
                        "Processing creature {} of {}",
                        table_idx * total_rows + row_idx,
                        total_tables * total_rows
                    ),
                )
                .emit(window);

                let name = cells[0].text().collect::<String>();
                let name = clean_name(&name);

                if !should_skip_creature(&name) {
                    let entity_id = cells[3].text().collect::<String>();
                    let entity_id = clean_name(&entity_id);

                    let blueprint_text = cells
                        .last()
                        .map(|cell| cell.text().collect::<String>())
                        .unwrap_or_default();

                    let blueprint =
                        extract_blueprint(&blueprint_text).unwrap_or_else(|| "Unknown".to_string());

                    let key = name.replace(" ", "_");
                    creatures.insert(
                        key.clone(),
                        Creature {
                            type_name: "creature".to_string(),
                            name,
                            mod_name: extract_mod_name(&blueprint),
                            entity_id,
                            blueprint,
                        },
                    );
                }
            }
        }
    }

    Ok(())
}

fn should_skip_creature(name: &str) -> bool {
    let skip_patterns = [
        "Alpha",
        "VR",
        "Malfunctioned",
        "Retrieve",
        "Escort",
        "Minion",
        "Gamma",
        "Beta",
        "Race",
        "Sport",
        "Summoned",
        "Hunt",
        "Mashup",
    ];
    skip_patterns.iter().any(|pattern| name.contains(pattern))
}
