use super::{common::*, progress::ScrapingProgress};
use crate::types::Creature;
use scraper::{Html, Selector};
use std::collections::HashMap;
use tauri::Window;

pub async fn scrape_creatures(
    window: &Window,
    creatures: &mut HashMap<String, Creature>,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let client = ScraperClient::new();
    let url = format!("{}/wiki/Creature_IDs", BASE_URL);
    let html = client.fetch_page(&url).await?;
    let document = Html::parse_document(&html);

    // Create selectors
    let header_selector = Selector::parse("h3 .mw-headline").unwrap();
    let table_selector = Selector::parse("table.wikitable").unwrap();
    let row_selector = Selector::parse("tr").unwrap();
    let cell_selector = Selector::parse("td").unwrap();
    let link_selector = Selector::parse("a").unwrap();

    // First pass: Count total rows across all tables
    let tables: Vec<_> = document.select(&table_selector).collect();
    let total_rows = tables
        .iter()
        .map(|table| table.select(&row_selector).count().saturating_sub(1)) // Subtract 1 for header
        .sum::<usize>();

    // Second pass: Process the creatures
    let mut current_mod = String::from("Ark");
    let mut processed_rows = 0;

    for table in &tables {
        // Look for the preceding h3 header
        let mut current_element = table.prev_sibling();
        while let Some(element) = current_element {
            if let Some(element_ref) = element.value().as_element() {
                if element_ref.name() == "h3" {
                    if let Some(headline) = scraper::ElementRef::wrap(element)
                        .and_then(|el| el.select(&header_selector).next())
                    {
                        current_mod = extract_mod_from_header(&headline.text().collect::<String>());
                    }
                    break;
                }
            }
            current_element = element.prev_sibling();
        }

        // Process table rows
        let rows = table.select(&row_selector).skip(1); // Skip header row
        for row in rows {
            let cells: Vec<_> = row.select(&cell_selector).collect();

            if cells.len() >= 4 {
                processed_rows += 1;
                let progress = (processed_rows as f32 / total_rows as f32) * 100.0;

                ScrapingProgress::new(
                    "creatures",
                    progress,
                    &format!(
                        "Processing creature {} of {} ({})",
                        processed_rows, total_rows, current_mod
                    ),
                )
                .emit(window);

                // Get display name from the title attribute of the last link in the first cell
                let display_name = if let Some(name_cell) = cells.first() {
                    let links: Vec<_> = name_cell.select(&link_selector).collect();
                    if let Some(last_link) = links.last() {
                        if let Some(title) = last_link.value().attr("title") {
                            clean_name(title)
                        } else {
                            clean_name(&last_link.text().collect::<String>())
                        }
                    } else {
                        clean_name(&name_cell.text().collect::<String>())
                    }
                } else {
                    continue;
                };

                if !should_skip_creature(&display_name) {
                    // Extract entity ID from fourth column
                    let entity_id = clean_name(&cells[3].text().collect::<String>());

                    // Extract blueprint from last column
                    let blueprint_text = cells
                        .last()
                        .map(|cell| cell.text().collect::<String>())
                        .unwrap_or_default();

                    if let Some(blueprint) = extract_blueprint(&blueprint_text) {
                        // Use display name for the key generation
                        let key = generate_unique_key(&display_name, &blueprint, &current_mod);

                        creatures.insert(
                            key.clone(),
                            Creature {
                                type_name: "creature".to_string(),
                                name: display_name.clone(),
                                mod_name: current_mod.clone(),
                                entity_id,
                                blueprint,
                            },
                        );
                    }
                }
            }
        }
    }

    // Final completion message
    ScrapingProgress::new(
        "creatures",
        100.0,
        &format!("Completed processing {} creatures", creatures.len()),
    )
    .emit(window);

    Ok(())
}

fn generate_unique_key(name: &str, _blueprint: &str, mod_name: &str) -> String {
    format!(
        "{}_{}",
        mod_name.replace(" ", "_"),
        name.replace(" ", "_").replace("-", "_")
    )
}

fn extract_mod_from_header(header: &str) -> String {
    if header.contains("Scorched Earth") {
        "Scorched Earth".to_string()
    } else if header.contains("Aberration") {
        "Aberration".to_string()
    } else if header.contains("Extinction") {
        "Extinction".to_string()
    } else if header.contains("Genesis") {
        "Genesis".to_string()
    } else {
        "Ark".to_string()
    }
}

fn should_skip_creature(name: &str) -> bool {
    let skip_patterns = [
        "Alpha",
        "VR",
        "Malfunctioned",
        "Retrieve",
        "Escort",
        "Minion",
        "Race",
        "Sport",
        "Summoned",
        "Hunt",
        "Mashup",
    ];
    skip_patterns.iter().any(|pattern| name.contains(pattern))
}
