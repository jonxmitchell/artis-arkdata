use super::{common::*, progress::ScrapingProgress};
use crate::types::Creature;
use scraper::{Element, Html, Selector};
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

    // Find all headers and tables
    let mut current_mod = String::from("Ark");
    let mut total_processed = 0;

    let tables = document.select(&table_selector);
    for table in tables {
        // Look for the preceding h3 header
        let mut current_element = table.prev_sibling_element();
        while let Some(element) = current_element {
            if element.value().name() == "h3" {
                if let Some(headline) = element.select(&header_selector).next() {
                    current_mod = extract_mod_from_header(&headline.text().collect::<String>());
                }
                break;
            }
            current_element = element.prev_sibling_element();
        }

        // Process table rows
        let rows = table.select(&row_selector).skip(1); // Skip header row
        for row in rows {
            let cells: Vec<_> = row.select(&cell_selector).collect();

            if cells.len() >= 4 {
                total_processed += 1;
                let progress = (total_processed as f32) * 100.0;

                ScrapingProgress::new(
                    "creatures",
                    progress,
                    &format!("Processing creature {}", total_processed),
                )
                .emit(window);

                // Get display name from first column's link for readability
                let display_name = if let Some(name_cell) = cells.first() {
                    if let Some(link) = name_cell.select(&link_selector).next() {
                        clean_name(&link.text().collect::<String>())
                    } else {
                        clean_name(&name_cell.text().collect::<String>())
                    }
                } else {
                    continue;
                };

                // Get dino tag name from third column
                let name = if cells.len() > 2 {
                    clean_name(&cells[2].text().collect::<String>())
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
                        let key = format_title(&name);

                        creatures.insert(
                            key.clone(),
                            Creature {
                                type_name: "creature".to_string(),
                                name, // Using the dino tag name
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

    Ok(())
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

fn format_title(title: &str) -> String {
    title
        .replace(" ", "_")
        .replace("(", "")
        .replace(")", "")
        .replace("\"", "")
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
        "Ghost",
        "Zombie",
        "Bone",
        "Skeletal",
    ];
    skip_patterns.iter().any(|pattern| name.contains(pattern))
}
