#!/usr/bin/env bash
# Install pi-wafer extension into Pi via symlink.
# Source stays here — edits are picked up on Pi restart.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
EXT_DIR="$HOME/.pi/agent/extensions"

mkdir -p "$EXT_DIR"

ln -sfn "$SCRIPT_DIR/pi-wafer.ts" "$EXT_DIR/pi-wafer.ts"
echo "✓ Symlinked pi-wafer.ts → $EXT_DIR/pi-wafer.ts"

echo ""
echo "Installed pi-wafer."
echo "Use /model to switch to a Wafer model (wafer/GLM-5.1, etc.)"
echo "Restart Pi to pick up changes."
