use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::Emitter;
use zeroize::Zeroize;
use vault::ActiveVault;

mod vault;

struct VaultState {
    active: Option<ActiveVault>,
    password: Option<String>,
}

impl VaultState {
    fn new() -> Self {
        Self {
            active: None,
            password: None,
        }
    }

    fn lock(&mut self) {
        if let Some(ref mut pw) = self.password {
            pw.zeroize();
        }
        if let Some(ref mut av) = self.active {
            av.zeroize();
        }
        self.active = None;
        self.password = None;
    }
}

#[tauri::command]
fn get_workspaces() -> Result<Vec<String>, String> {
    vault::list_workspaces().map_err(|e| e.to_string())
}

#[tauri::command]
fn create_workspace(name: &str, password: &str) -> Result<(), String> {
    if name.trim().is_empty() {
        return Err("Workspace name cannot be empty".into());
    }
    if password.len() < 4 {
        return Err("Password must be at least 4 characters".into());
    }
    vault::create_workspace(name, password).map_err(|e| e.to_string())
}

#[tauri::command]
fn unlock_workspace(
    state: tauri::State<'_, Mutex<VaultState>>,
    name: &str,
    password: &str,
) -> Result<Vec<String>, String> {
    let data = vault::unlock_workspace(name, password).map_err(|e| e.to_string())?;

    let mut st = state.lock().map_err(|e| format!("Lock error: {}", e))?;
    st.active = Some(ActiveVault {
        data: data.clone(),
        workspace: name.to_string(),
    });
    st.password = Some(password.to_string());

    let keys: Vec<String> = data.secrets.keys().cloned().collect();
    Ok(keys)
}

#[tauri::command]
fn lock_workspace(state: tauri::State<'_, Mutex<VaultState>>) -> Result<(), String> {
    let mut st = state.lock().map_err(|e| format!("Lock error: {}", e))?;
    st.lock();
    Ok(())
}

#[derive(Serialize, Deserialize)]
struct VaultPayload {
    secrets: HashMap<String, String>,
    recovery_files: HashMap<String, String>,
}

#[tauri::command]
fn get_vault_data(
    state: tauri::State<'_, Mutex<VaultState>>,
) -> Result<VaultPayload, String> {
    let st = state.lock().map_err(|e| format!("Lock error: {}", e))?;
    match &st.active {
        Some(active) => Ok(VaultPayload {
            secrets: active.data.secrets.clone(),
            recovery_files: active.data.recovery_files.clone(),
        }),
        None => Err("No workspace is unlocked".into()),
    }
}

#[tauri::command]
fn save_vault_data(
    state: tauri::State<'_, Mutex<VaultState>>,
    secrets: HashMap<String, String>,
    recovery_files: HashMap<String, String>,
) -> Result<(), String> {
    let mut st = state.lock().map_err(|e| format!("Lock error: {}", e))?;

    let (workspace, password) = {
        let active = st
            .active
            .as_ref()
            .ok_or_else(|| "No workspace is unlocked".to_string())?;
        let pw = st
            .password
            .as_ref()
            .ok_or_else(|| "Password not in memory".to_string())?;
        (active.workspace.clone(), pw.clone())
    };

    let active = st
        .active
        .as_mut()
        .ok_or_else(|| "No workspace is unlocked".to_string())?;
    active.data.secrets = secrets;
    active.data.recovery_files = recovery_files;

    vault::save_workspace(&workspace, &active.data, &password).map_err(|e| e.to_string())
}

#[derive(Clone, Serialize)]
struct SyncEvent {
    success: bool,
    message: String,
}

#[tauri::command]
fn rename_workspace(
    state: tauri::State<'_, Mutex<VaultState>>,
    new_name: &str,
) -> Result<(), String> {
    if new_name.trim().is_empty() {
        return Err("Workspace name cannot be empty".into());
    }

    let mut st = state.lock().map_err(|e| format!("Lock error: {}", e))?;
    let old_name = st
        .active
        .as_ref()
        .ok_or_else(|| "No workspace is unlocked".to_string())?
        .workspace
        .clone();

    vault::rename_workspace(&old_name, new_name).map_err(|e| e.to_string())?;

    if let Some(ref mut av) = st.active {
        av.workspace = new_name.to_string();
    }

    Ok(())
}

#[tauri::command]
fn sync_workspace_to_cloud(
    app: tauri::AppHandle,
    state: tauri::State<'_, Mutex<VaultState>>,
) -> Result<(), String> {
    let workspace = {
        let st = state.lock().map_err(|e| format!("Lock error: {}", e))?;
        st.active
            .as_ref()
            .ok_or_else(|| "No workspace is unlocked".to_string())?
            .workspace
            .clone()
    };

    let app_clone = app.clone();
    std::thread::spawn(move || {
        let result = vault::sync_to_cloud(&workspace);
        let event = match result {
            Ok(msg) => SyncEvent {
                success: true,
                message: msg,
            },
            Err(e) => SyncEvent {
                success: false,
                message: e.to_string(),
            },
        };
        let _ = app_clone.emit("sync-result", event);
    });

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(Mutex::new(VaultState::new()))
        .invoke_handler(tauri::generate_handler![
            get_workspaces,
            create_workspace,
            unlock_workspace,
            lock_workspace,
            get_vault_data,
            save_vault_data,
            sync_workspace_to_cloud,
            rename_workspace,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
