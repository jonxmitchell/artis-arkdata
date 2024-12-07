use serde::Serialize;
use tauri::Window;

#[derive(Serialize, Clone)]
pub struct ScrapingProgress {
    pub stage: String,
    pub progress: f32,
    pub message: String,
}

impl ScrapingProgress {
    pub fn new(stage: &str, progress: f32, message: &str) -> Self {
        Self {
            stage: stage.to_string(),
            progress,
            message: message.to_string(),
        }
    }

    pub fn emit(&self, window: &Window) {
        window
            .emit("scraping-progress", self)
            .unwrap_or_else(|e| eprintln!("Failed to emit progress: {}", e));
    }
}

pub fn emit_progress(window: &Window, stage: &str, progress: f32, message: &str) {
    let progress_data = ScrapingProgress::new(stage, progress, message);
    progress_data.emit(window);
}
