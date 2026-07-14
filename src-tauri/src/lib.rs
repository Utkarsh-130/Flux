use std::process::Command;
use std::thread;
use std::io::{BufReader, BufRead};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .setup(|app| {
      #[cfg(debug_assertions)]
      {
        let _ = app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        );
      }

      #[cfg(debug_assertions)]
      {
          match std::process::Command::new("python").arg("../app.py").stdout(std::process::Stdio::piped()).spawn() {
              Ok(mut child) => {
                  if let Some(stdout) = child.stdout.take() {
                      std::thread::spawn(move || {
                          let reader = std::io::BufReader::new(stdout);
                          for line in std::io::BufRead::lines(reader) {
                              if let Ok(l) = line {
                                  println!("Python: {}", l);
                              }
                          }
                      });
                  }
              },
              Err(e) => eprintln!("Failed to start python backend: {}", e),
          }
      }

      #[cfg(not(debug_assertions))]
      {
          use tauri_plugin_shell::ShellExt;
          let sidecar_command = app.shell().sidecar("backend").expect("failed to create sidecar command");
          let (_rx, _child) = sidecar_command.spawn().expect("Failed to spawn sidecar");
      }

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
