#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BINARY="${SCRIPT_DIR}/src-tauri/target/release/vault-cat"

usage() {
  echo "Usage: $0 [--prefix <dir>] [--user] [--system]"
  echo "  --user     Install to ~/.local (default)"
  echo "  --system   Install to /usr/local (requires sudo)"
  echo "  --prefix   Custom install prefix (e.g. /opt/vault-cat)"
  exit 1
}

MODE="user"
PREFIX=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --user) MODE="user" ;;
    --system) MODE="system" ;;
    --prefix)
      PREFIX="$2"
      MODE="prefix"
      shift ;;
    -h|--help) usage ;;
    *) echo "Unknown option: $1"; usage ;;
  esac
  shift
done

if [[ ! -f "$BINARY" ]]; then
  echo "Binary not found at $BINARY"
  echo "Run 'pnpm tauri build' first or specify a different binary path."
  exit 1
fi

case "$MODE" in
  user)
    BIN_DIR="$HOME/.local/bin"
    ICON_DIR="$HOME/.local/share/icons/hicolor/128x128/apps"
    DESKTOP_DIR="$HOME/.local/share/applications"
    EXEC_PATH="$BIN_DIR/vault-cat"
    ;;
  system)
    BIN_DIR="/usr/local/bin"
    ICON_DIR="/usr/local/share/icons/hicolor/128x128/apps"
    DESKTOP_DIR="/usr/local/share/applications"
    EXEC_PATH="$BIN_DIR/vault-cat"
    ;;
  prefix)
    BIN_DIR="$PREFIX/bin"
    ICON_DIR="$PREFIX/share/icons/hicolor/128x128/apps"
    DESKTOP_DIR="$PREFIX/share/applications"
    EXEC_PATH="$BIN_DIR/vault-cat"
    ;;
esac

CMD_PREFIX=""
if [[ "$MODE" == "system" || "$MODE" == "prefix" ]]; then
  CMD_PREFIX="sudo"
fi

$CMD_PREFIX mkdir -p "$BIN_DIR" "$ICON_DIR" "$DESKTOP_DIR"

$CMD_PREFIX cp "$BINARY" "$EXEC_PATH"
$CMD_PREFIX chmod 755 "$EXEC_PATH"

$CMD_PREFIX cp "${SCRIPT_DIR}/src-tauri/icons/128x128.png" "${ICON_DIR}/vault-cat.png"

ICON_THEME_DIR="$(dirname "$ICON_DIR")"
$CMD_PREFIX gtk-update-icon-cache -f -t "$ICON_THEME_DIR" 2>/dev/null || true

$CMD_PREFIX tee "$DESKTOP_DIR/vault-cat.desktop" > /dev/null <<DESKTOP
[Desktop Entry]
Name=Vault Cat
Comment=Secure Credentials Manager
Exec=${EXEC_PATH}
Icon=vault-cat
Terminal=false
Type=Application
Categories=Utility;Security;
StartupNotify=true
DESKTOP

echo "Installed vault-cat to $BIN_DIR"
echo "  binary:   $EXEC_PATH"
echo "  icon:     ${ICON_DIR}/vault-cat.png"
echo "  desktop:  $DESKTOP_DIR/vault-cat.desktop"
