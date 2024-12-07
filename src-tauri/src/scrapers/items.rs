use super::{common::*, progress::ScrapingProgress};
use crate::types::Item;
use scraper::{ElementRef, Html, Selector};
use std::collections::HashMap;
use std::time::Duration;
use tauri::Window;

const SECTIONS: &[&str] = &[
    "Resources",
    "Tools",
    "Armor",
    "Saddles",
    "Structures",
    "Vehicles",
    "Dye",
    "Consumables",
    "Recipes",
    "Eggs",
    "Farming",
    "Seeds",
    "Weapons", // Changed from "Weapons and Attachments"
    "Ammunition",
    "Skins",
    "Chibi Pets",
    "Artifacts",
    "Trophy", // Changed from "Trophies"
];

fn format_section_url(section: &str) -> String {
    // Special cases for sections with different URL patterns
    match section {
        "Weapons" => format!("{}/wiki/Item_IDs/Weapons", BASE_URL),
        "Trophy" => format!("{}/wiki/Item_IDs/Trophy", BASE_URL),
        "Chibi Pets" => format!("{}/wiki/Item_IDs/Chibi_Pets", BASE_URL),
        _ => {
            let formatted = section
                .replace(' ', "_")
                .replace('&', "and")
                .replace("_Pets", "-Pets");
            format!("{}/wiki/Item_IDs/{}", BASE_URL, formatted)
        }
    }
}

fn extract_name_from_cell(cell: &ElementRef) -> Option<String> {
    let link_selector = Selector::parse("a").unwrap();

    // First try to find a link with title attribute
    if let Some(link) = cell.select(&link_selector).next() {
        // Try title attribute first
        if let Some(title) = link.value().attr("title") {
            let name = clean_name(title);
            if !name.is_empty() {
                return Some(name);
            }
        }

        // Fall back to link text
        let name = clean_name(&link.text().collect::<String>());
        if !name.is_empty() {
            return Some(name);
        }
    }

    // Fall back to cell text if no valid link found
    let name = clean_name(&cell.text().collect::<String>());
    if !name.is_empty() {
        Some(name)
    } else {
        None
    }
}

fn extract_type_from_cell(cell: &ElementRef) -> Option<String> {
    let type_text = cell.text().collect::<String>();
    let cleaned_type = clean_name(&type_text);
    if !cleaned_type.is_empty() {
        Some(cleaned_type)
    } else {
        None
    }
}

fn extract_class_name_from_cell(cell: &ElementRef) -> Option<String> {
    let class_text = cell.text().collect::<String>();
    let cleaned_class = clean_name(&class_text);
    if !cleaned_class.is_empty() {
        Some(cleaned_class)
    } else {
        None
    }
}

pub async fn scrape_items(
    window: &Window,
    items: &mut HashMap<String, Item>,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let client = ScraperClient::new();

    ScrapingProgress::new("items", 0.0, "Starting item data collection...").emit(window);

    let mut processed_items = 0;
    let mut failed_items = 0;
    let mut failed_sections = Vec::new();
    let mut successful_sections = Vec::new();

    for (section_idx, &section) in SECTIONS.iter().enumerate() {
        let progress = (section_idx as f32 / SECTIONS.len() as f32) * 100.0;

        ScrapingProgress::new(
            "items",
            progress,
            &format!("Processing section: {}", section),
        )
        .emit(window);

        let mut urls_to_try = vec![format_section_url(section)];

        // Add alternate URLs for problematic sections
        match section {
            "Trophy" => {
                urls_to_try.push(format!("{}/wiki/Item_IDs/Trophies", BASE_URL));
            }
            "Weapons" => {
                urls_to_try.push(format!("{}/wiki/Item_IDs/Weapon", BASE_URL));
            }
            _ => {}
        }

        let mut section_success = false;
        let mut section_items = 0;

        for url in &urls_to_try {
            println!("\nTrying URL for section {}: {}", section, url);

            match client.fetch_page(url).await {
                Ok(content) => {
                    let document = Html::parse_document(&content);
                    let table_selector = Selector::parse("table.wikitable").unwrap();
                    let row_selector = Selector::parse("tr").unwrap();
                    let cell_selector = Selector::parse("td").unwrap();

                    let tables: Vec<_> = document.select(&table_selector).collect();
                    println!("Found {} tables in section {}", tables.len(), section);

                    if tables.is_empty() {
                        println!("No tables found for URL: {}", url);
                        continue;
                    }

                    for (table_idx, table) in tables.iter().enumerate() {
                        let rows: Vec<_> = table.select(&row_selector).collect();
                        println!("Table {} has {} rows", table_idx + 1, rows.len());

                        for row in rows.iter().skip(1) {
                            let cells: Vec<_> = row.select(&cell_selector).collect();

                            if cells.len() >= 5 {
                                if let Some(name_cell) = cells.first() {
                                    if let Some(name) = extract_name_from_cell(name_cell) {
                                        if !should_skip_item(&name) {
                                            let type_name = cells
                                                .get(1)
                                                .and_then(|cell| extract_type_from_cell(cell))
                                                .unwrap_or_else(|| section.to_string());

                                            let class_name = cells
                                                .get(4)
                                                .and_then(|cell| extract_class_name_from_cell(cell))
                                                .unwrap_or_else(|| "Unknown".to_string());

                                            if let Some(blueprint_cell) = cells.last() {
                                                let blueprint_text =
                                                    blueprint_cell.text().collect::<String>();

                                                match extract_blueprint(&blueprint_text) {
                                                    Some(blueprint) => {
                                                        let key = name.replace(" ", "_");
                                                        let mod_name = extract_mod_name(&blueprint);

                                                        println!("Processing item: {}", name);
                                                        println!("  Type: {}", type_name);
                                                        println!("  Class: {}", class_name);
                                                        println!("  Blueprint: {}", blueprint);
                                                        println!("  Mod: {}", mod_name);

                                                        items.insert(
                                                            key,
                                                            Item {
                                                                type_name,
                                                                name,
                                                                mod_name,
                                                                class_name,
                                                                blueprint,
                                                            },
                                                        );

                                                        processed_items += 1;
                                                        section_items += 1;
                                                    }
                                                    None => {
                                                        println!(
                                                            "Failed to extract blueprint for: {}",
                                                            name
                                                        );
                                                        failed_items += 1;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    if section_items > 0 {
                        section_success = true;
                        break; // Successfully processed this section, move to next
                    }
                }
                Err(e) => {
                    eprintln!("Failed to fetch URL {} for section {}: {}", url, section, e);
                }
            }

            tokio::time::sleep(Duration::from_millis(500)).await;
        }

        if section_success {
            successful_sections.push(section);
            println!(
                "Successfully processed {} items from section {}",
                section_items, section
            );
        } else {
            failed_sections.push(section);
            println!("Failed to process section: {}", section);
        }
    }

    let completion_message = format!(
        "Processed {} items successfully ({} failed)\nSuccessful sections: {}\nFailed sections: {}",
        processed_items,
        failed_items,
        if successful_sections.is_empty() {
            "None".to_string()
        } else {
            successful_sections.join(", ")
        },
        if failed_sections.is_empty() {
            "None".to_string()
        } else {
            failed_sections.join(", ")
        }
    );

    ScrapingProgress::new("items", 100.0, &completion_message).emit(window);

    println!("\n{}", completion_message);
    println!("Items in collection: {}", items.len());

    if items.is_empty() {
        Err("No items were successfully scraped".into())
    } else {
        Ok(())
    }
}

fn should_skip_item(name: &str) -> bool {
    let skip_patterns = ["undefined", "null", "(alt)", "Beer_Jar_", "Platform_Cart"];

    let result = skip_patterns.iter().any(|pattern| name.contains(pattern));
    if result {
        println!("Skipping item due to pattern match: {}", name);
    }
    result
}
