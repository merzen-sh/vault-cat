#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TARGET="${1:-x86_64-unknown-linux-gnu}"
BUNDLES="${2:-deb}"

cd "$SCRIPT_DIR"

echo "Building frontend and Rust backend (target: $TARGET, bundles: $BUNDLES)..."

pnpm tauri build --target "$TARGET" --bundles "$BUNDLES"

echo ""
echo "Build complete."
echo "  binary:  ${SCRIPT_DIR}/src-tauri/target/${TARGET}/release/vault-cat"
echo "  bundles: ${SCRIPT_DIR}/src-tauri/target/${TARGET}/release/bundle/"
