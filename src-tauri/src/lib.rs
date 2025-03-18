use std::{fs, io::Result, path::Path};

fn read_dir_core<P>(files: &mut Vec<String>, dir: P) -> Result<()>
where
  P: AsRef<Path>,
{
  for entry in fs::read_dir(dir)? {
    let entry = entry?;
    let path = entry.path();

    if path.is_dir() {
      read_dir_core(files, path)?;
    } else {
      let path = path.into_os_string().into_string().unwrap_or_default();

      if path.ends_with(".mp3") || path.ends_with(".wav") {
        files.push(path);
      }
    }
  }

  Ok(())
}

#[tauri::command]
fn read_dir(dir: &str) -> Vec<String> {
  let mut files = Vec::new();
  let _ = read_dir_core(&mut files, dir);
  files
}

#[tauri::command]
fn rename(from: &str, to: &str) {
  let _ = fs::rename(from, to);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_http::init())
    .invoke_handler(tauri::generate_handler![read_dir, rename])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
