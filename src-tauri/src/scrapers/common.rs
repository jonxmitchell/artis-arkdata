use regex::Regex;
use reqwest;
use std::sync::Arc;

pub const BASE_URL: &str = "https://ark.wiki.gg";

pub struct ScraperClient {
    client: Arc<reqwest::Client>,
}

impl ScraperClient {
    pub fn new() -> Self {
        Self {
            client: Arc::new(reqwest::Client::new()),
        }
    }

    pub async fn fetch_page(&self, url: &str) -> Result<String, reqwest::Error> {
        self.client.get(url).send().await?.text().await
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
        .replace("  ", " ")
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
    } else {
        "Unknown".to_string()
    }
}
