use super::{common::*, progress::ScrapingProgress};
use crate::types::Item;
use scraper::{Html, Selector};
use std::collections::HashMap;
use std::sync::Arc;
use tauri::Window;

pub async fn scrape_items(
    window: &Window,
    items: &mut HashMap<String, Item>,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let client = ScraperClient::new();
    let url = format!("{}/wiki/Item_IDs", BASE_URL);
    let html = client.fetch_page(&url).await?;
    let document = Html::parse_document(&html);

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

            if cells.len() >= 5 {
                let progress = ((table_idx as f32 / total_tables as f32)
                    + (row_idx as f32 / total_rows as f32 / total_tables as f32))
                    * 100.0;

                ScrapingProgress::new(
                    "items",
                    progress,
                    &format!(
                        "Processing item {} of {}",
                        table_idx * total_rows + row_idx,
                        total_tables * total_rows
                    ),
                )
                .emit(window);

                let name = clean_name(&cells[0].text().collect::<String>());

                if !should_skip_item(&name) {
                    let type_name = clean_name(&cells[1].text().collect::<String>());
                    let class_name = clean_name(&cells[4].text().collect::<String>());

                    let blueprint_text = cells
                        .last()
                        .map(|cell| cell.text().collect::<String>())
                        .unwrap_or_default();

                    let blueprint =
                        extract_blueprint(&blueprint_text).unwrap_or_else(|| "Unknown".to_string());

                    let key = name.replace(" ", "_");
                    items.insert(
                        key.clone(),
                        Item {
                            type_name,
                            name,
                            mod_name: extract_mod_name(&blueprint),
                            class_name,
                            blueprint,
                        },
                    );
                }
            }
        }
    }

    Ok(())
}

fn should_skip_item(name: &str) -> bool {
    let skip_patterns = [
        "Tek_ATV",
        "Beer_Jar_(alt)",
        "Pistol_Hat_Skins",
        "Deathworm_Horn_or_Woolly_Rhino_Horn",
    ];
    skip_patterns.iter().any(|pattern| name.contains(pattern))
}
