use super::{common::*, progress::ScrapingProgress};
use crate::types::Engram;
use futures::stream::{self, StreamExt};
use scraper::{Html, Selector};
use std::collections::HashMap;
use std::sync::Arc;
use tauri::Window;

pub async fn scrape_engrams(
    window: &Window,
    engrams: &mut HashMap<String, Engram>,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let client = Arc::new(ScraperClient::new());
    let url = format!("{}/wiki/Engrams", BASE_URL);
    let html = client.fetch_page(&url).await?;

    // Process HTML in a separate scope to ensure it doesn't cross await boundaries
    let engram_links = {
        let document = Html::parse_document(&html);
        let table_selector = Selector::parse("table.wikitable").unwrap();
        let row_selector = Selector::parse("tr").unwrap();
        let cell_selector = Selector::parse("td").unwrap();
        let link_selector = Selector::parse("a").unwrap();

        let mut links = Vec::new();
        for table in document.select(&table_selector) {
            for row in table.select(&row_selector).skip(1) {
                if let Some(link) = row
                    .select(&cell_selector)
                    .next()
                    .and_then(|cell| cell.select(&link_selector).next())
                {
                    if let Some(href) = link.value().attr("href") {
                        links.push(format!("{}{}", BASE_URL, href));
                    }
                }
            }
        }
        links
    };

    let total_engrams = engram_links.len();
    let window = Arc::new(window.clone());

    // Process engrams in parallel with controlled concurrency
    let mut stream = stream::iter(engram_links.into_iter().enumerate())
        .map(|(idx, url): (usize, String)| {
            let client = Arc::clone(&client);
            let window = Arc::clone(&window);

            async move {
                let progress = (idx as f32 / total_engrams as f32) * 100.0;
                ScrapingProgress::new(
                    "engrams",
                    progress,
                    &format!("Processing engram {} of {}", idx + 1, total_engrams),
                )
                .emit(&window);

                match scrape_single_engram(&client, &url).await {
                    Ok(Some((key, engram))) => Some((key, engram)),
                    _ => None,
                }
            }
        })
        .buffer_unordered(5);

    while let Some(result) = stream.next().await {
        if let Some((key, engram)) = result {
            engrams.insert(key, engram);
        }
    }

    Ok(())
}

async fn scrape_single_engram(
    client: &ScraperClient,
    url: &str,
) -> Result<Option<(String, Engram)>, Box<dyn std::error::Error + Send + Sync>> {
    let html = client.fetch_page(url).await?;

    // Process HTML in a separate scope
    let result = {
        let document = Html::parse_document(&html);
        let name_selector = Selector::parse("h1").unwrap();
        let command_selector = Selector::parse("code.copy-clipboard").unwrap();

        if let Some(name_elem) = document.select(&name_selector).next() {
            let name = clean_name(&name_elem.text().collect::<String>());

            if !should_skip_engram(&name) {
                let blueprint = document
                    .select(&command_selector)
                    .find(|elem| elem.text().collect::<String>().contains("Blueprint"))
                    .and_then(|elem| extract_blueprint(&elem.text().collect::<String>()))
                    .unwrap_or_else(|| "Unknown".to_string());

                let key = name.replace(" ", "_");
                return Ok(Some((
                    key,
                    Engram {
                        type_name: "engram".to_string(),
                        name,
                        mod_name: extract_mod_name(&blueprint),
                        blueprint,
                    },
                )));
            }
        }
        Ok(None)
    };

    result
}

fn should_skip_engram(name: &str) -> bool {
    let skip_patterns = ["Platform_Cart"];
    skip_patterns.iter().any(|pattern| name.contains(pattern))
}
