use regex::Regex;
use reqwest::{Client, ClientBuilder};
use std::sync::Arc;
use std::time::Duration;

pub const BASE_URL: &str = "https://ark.wiki.gg";

pub struct ScraperClient {
    client: Arc<Client>,
}

impl ScraperClient {
    pub fn new() -> Self {
        let client = ClientBuilder::new()
            .timeout(Duration::from_secs(30))
            .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
            .build()
            .unwrap();

        Self {
            client: Arc::new(client),
        }
    }

    pub async fn fetch_page(&self, url: &str) -> Result<String, reqwest::Error> {
        let mut retries = 3;

        while retries > 0 {
            match self.client.get(url).send().await {
                Ok(response) => {
                    if response.status().is_success() {
                        match response.text().await {
                            Ok(text) => return Ok(text),
                            Err(e) => {
                                retries -= 1;
                                if retries == 0 {
                                    return Err(e);
                                }
                            }
                        }
                    } else {
                        retries -= 1;
                        if retries == 0 {
                            return Err(response.error_for_status().unwrap_err());
                        }
                    }
                }
                Err(e) => {
                    retries -= 1;
                    if retries == 0 {
                        return Err(e);
                    }
                }
            }

            if retries > 0 {
                tokio::time::sleep(Duration::from_secs(1)).await;
            }
        }

        unreachable!("Loop should return before reaching this point")
    }
}

pub fn extract_blueprint(text: &str) -> Option<String> {
    let re = Regex::new(r#"Blueprint'/Game/.*?'"#).ok()?;
    re.find(text).map(|m| m.as_str().to_string())
}

pub fn clean_name(name: &str) -> String {
    // Split by parentheses and take the first part
    let base_name = name.split('(').next().unwrap_or(name);

    base_name
        .trim()
        .replace('\n', "")
        .replace('\r', "")
        .replace("  ", " ") // Remove double spaces
        .trim()
        .to_string()
}

pub fn extract_mod_name(blueprint: &str) -> String {
    if blueprint.contains("/PrimalEarth/") {
        "Ark".to_string()
    } else if blueprint.contains("/ScorchedEarth/") {
        "Scorched Earth".to_string()
    } else if blueprint.contains("/Aberration/") {
        "Aberration".to_string()
    } else if blueprint.contains("/Extinction/") {
        "Extinction".to_string()
    } else if blueprint.contains("/Genesis/") {
        "Genesis".to_string()
    } else if blueprint.contains("/Gen2/") {
        "Genesis 2".to_string()
    } else if blueprint.contains("/Valguero/") {
        "Valguero".to_string()
    } else if blueprint.contains("/CrystalIsles/") {
        "Crystal Isles".to_string()
    } else if blueprint.contains("/Ragnarok/") {
        "Ragnarok".to_string()
    } else if blueprint.contains("/TheCenter/") {
        "The Center".to_string()
    } else if blueprint.contains("/LostIsland/") {
        "Lost Island".to_string()
    } else if blueprint.contains("/Fjordur/") {
        "Fjordur".to_string()
    } else {
        "Unknown".to_string()
    }
}
