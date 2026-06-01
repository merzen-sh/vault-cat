use argon2::{Argon2, password_hash::{PasswordHasher, SaltString}};
use chacha20poly1305::{
    aead::{Aead, KeyInit},
    ChaCha20Poly1305, Key, Nonce,
};
use rand::rngs::OsRng;
use rand::RngCore;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use thiserror::Error;
use zeroize::Zeroize;

const SALT_LEN: usize = 16;
const NONCE_LEN: usize = 12;

#[derive(Error, Debug)]
pub enum VaultError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Serialization error: {0}")]
    Serialization(#[from] bincode::Error),
    #[error("Cryptography error: {0}")]
    Crypto(String),
    #[error("Invalid format: {0}")]
    InvalidFormat(String),
    #[error("Workspace not found: {0}")]
    NotFound(String),
}

impl From<VaultError> for String {
    fn from(e: VaultError) -> String {
        e.to_string()
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct VaultData {
    pub secrets: HashMap<String, String>,
    pub recovery_files: HashMap<String, String>,
}

impl VaultData {
    pub fn zeroize(&mut self) {
        for v in self.secrets.values_mut() {
            v.zeroize();
        }
        for v in self.recovery_files.values_mut() {
            v.zeroize();
        }
        self.secrets.clear();
        self.recovery_files.clear();
    }
}

impl VaultData {
    pub fn empty() -> Self {
        Self {
            secrets: HashMap::new(),
            recovery_files: HashMap::new(),
        }
    }
}

#[derive(Debug, Clone)]
pub struct ActiveVault {
    pub data: VaultData,
    pub workspace: String,
}

impl ActiveVault {
    pub fn zeroize(&mut self) {
        self.data.zeroize();
        self.workspace.zeroize();
    }
}

fn get_workspaces_dir() -> PathBuf {
    dirs::home_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join(".config")
        .join("vault-cat")
        .join("workspaces")
}

pub fn list_workspaces() -> Result<Vec<String>, VaultError> {
    let dir = get_workspaces_dir();
    if !dir.exists() {
        return Ok(vec![]);
    }
    let mut workspaces = vec![];
    for entry in std::fs::read_dir(dir)? {
        let entry = entry?;
        if entry.file_type()?.is_dir() {
            if let Some(name) = entry.file_name().to_str() {
                workspaces.push(name.to_string());
            }
        }
    }
    workspaces.sort();
    Ok(workspaces)
}

fn workspace_vault_path(name: &str) -> PathBuf {
    get_workspaces_dir().join(name).join("vault.enc")
}

pub fn create_workspace(name: &str, password: &str) -> Result<(), VaultError> {
    let dir = get_workspaces_dir().join(name);
    std::fs::create_dir_all(&dir)?;

    let vault_path = dir.join("vault.enc");
    if vault_path.exists() {
        return Err(VaultError::InvalidFormat(
            "Workspace already exists".into(),
        ));
    }

    let data = VaultData::empty();
    let encoded = bincode::serialize(&data)?;
    let (salt, nonce, ciphertext) = encrypt_raw(&encoded, password)?;

    let mut file_content = Vec::with_capacity(SALT_LEN + NONCE_LEN + ciphertext.len());
    file_content.extend_from_slice(&salt);
    file_content.extend_from_slice(&nonce);
    file_content.extend_from_slice(&ciphertext);

    std::fs::write(&vault_path, &file_content)?;
    Ok(())
}

fn derive_key(password: &str, salt: &[u8]) -> Result<[u8; 32], VaultError> {
    let salt_str = SaltString::encode_b64(salt)
        .map_err(|e| VaultError::Crypto(format!("Failed to encode salt: {}", e)))?;

    let argon2 = Argon2::default();
    let hash = argon2
        .hash_password(password.as_bytes(), &salt_str)
        .map_err(|e| VaultError::Crypto(format!("Argon2 hashing failed: {}", e)))?;

    let hash_bytes = hash
        .hash
        .ok_or_else(|| VaultError::Crypto("Argon2 produced no hash".into()))?;

    let full = hash_bytes.as_bytes();
    let mut key = [0u8; 32];
    key.copy_from_slice(&full[..32]);
    Ok(key)
}

fn encrypt_raw(plaintext: &[u8], password: &str) -> Result<([u8; SALT_LEN], [u8; NONCE_LEN], Vec<u8>), VaultError> {
    let mut salt = [0u8; SALT_LEN];
    OsRng.fill_bytes(&mut salt);

    let key_bytes = derive_key(password, &salt)?;
    let key = Key::from_slice(&key_bytes);
    let cipher = ChaCha20Poly1305::new(key);

    let mut nonce_bytes = [0u8; NONCE_LEN];
    OsRng.fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher
        .encrypt(nonce, plaintext)
        .map_err(|e| VaultError::Crypto(format!("Encryption failed: {}", e)))?;

    Ok((salt, nonce_bytes, ciphertext))
}

fn decrypt_raw(
    salt: &[u8; SALT_LEN],
    nonce: &[u8; NONCE_LEN],
    ciphertext: &[u8],
    password: &str,
) -> Result<Vec<u8>, VaultError> {
    let key_bytes = derive_key(password, salt)?;
    let key = Key::from_slice(&key_bytes);
    let cipher = ChaCha20Poly1305::new(key);
    let nonce = Nonce::from_slice(nonce);

    let plaintext = cipher
        .decrypt(nonce, ciphertext)
        .map_err(|e| VaultError::Crypto(format!("Decryption failed: {}", e)))?;

    Ok(plaintext)
}

pub fn unlock_workspace(name: &str, password: &str) -> Result<VaultData, VaultError> {
    let vault_path = workspace_vault_path(name);
    if !vault_path.exists() {
        return Err(VaultError::NotFound(format!("Workspace '{}' not found", name)));
    }

    let file_content = std::fs::read(&vault_path)?;
    if file_content.len() < SALT_LEN + NONCE_LEN {
        return Err(VaultError::InvalidFormat("Vault file is too short".into()));
    }

    let salt: [u8; SALT_LEN] = file_content[..SALT_LEN]
        .try_into()
        .map_err(|_| VaultError::InvalidFormat("Invalid salt".into()))?;
    let nonce: [u8; NONCE_LEN] = file_content[SALT_LEN..SALT_LEN + NONCE_LEN]
        .try_into()
        .map_err(|_| VaultError::InvalidFormat("Invalid nonce".into()))?;
    let ciphertext = &file_content[SALT_LEN + NONCE_LEN..];

    let plaintext = decrypt_raw(&salt, &nonce, ciphertext, password)?;
    let data: VaultData = bincode::deserialize(&plaintext)?;
    Ok(data)
}

pub fn save_workspace(name: &str, data: &VaultData, password: &str) -> Result<(), VaultError> {
    let encoded = bincode::serialize(data)?;
    let (salt, nonce, ciphertext) = encrypt_raw(&encoded, password)?;

    let vault_path = workspace_vault_path(name);
    let mut file_content = Vec::with_capacity(SALT_LEN + NONCE_LEN + ciphertext.len());
    file_content.extend_from_slice(&salt);
    file_content.extend_from_slice(&nonce);
    file_content.extend_from_slice(&ciphertext);

    std::fs::write(&vault_path, &file_content)?;
    Ok(())
}

pub fn rename_workspace(old_name: &str, new_name: &str) -> Result<(), VaultError> {
    if new_name.trim().is_empty() {
        return Err(VaultError::InvalidFormat("New name cannot be empty".into()));
    }
    let workspaces_dir = get_workspaces_dir();
    let old_path = workspaces_dir.join(old_name);
    let new_path = workspaces_dir.join(new_name);

    if !old_path.exists() {
        return Err(VaultError::NotFound(format!(
            "Workspace '{}' not found",
            old_name
        )));
    }
    if new_path.exists() {
        return Err(VaultError::InvalidFormat(
            "A workspace with that name already exists".into(),
        ));
    }

    std::fs::rename(&old_path, &new_path)?;
    Ok(())
}

pub fn pull_from_cloud() -> Result<String, VaultError> {
    let workspaces_dir = get_workspaces_dir();
    std::fs::create_dir_all(&workspaces_dir)?;

    let local_str = workspaces_dir.to_string_lossy().to_string();
    let remote = "gdrive:VaultCat_Backups/".to_string();

    let output = std::process::Command::new("rclone")
        .arg("copy")
        .arg(&remote)
        .arg(&local_str)
        .output()
        .map_err(|e| VaultError::Crypto(format!("Failed to execute rclone: {}", e)))?;

    if output.status.success() {
        Ok("Pull completed successfully".into())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        Err(VaultError::Crypto(format!("rclone pull failed: {}", stderr)))
    }
}

pub fn sync_to_cloud(name: &str) -> Result<String, VaultError> {
    let local_path = workspace_vault_path(name);
    if !local_path.exists() {
        return Err(VaultError::NotFound(format!("Workspace '{}' has no vault file", name)));
    }

    let local_str = local_path.to_string_lossy().to_string();
    let remote = format!("gdrive:VaultCat_Backups/{}/", name);

    let output = std::process::Command::new("rclone")
        .arg("copy")
        .arg(&local_str)
        .arg(&remote)
        .output()
        .map_err(|e| VaultError::Crypto(format!("Failed to execute rclone: {}", e)))?;

    if output.status.success() {
        Ok("Sync completed successfully".into())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        Err(VaultError::Crypto(format!("rclone sync failed: {}", stderr)))
    }
}
