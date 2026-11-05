#!/usr/bin/env bash
# One command for a fresh machine or a new cloud session: dependencies, Kokoro model, skills.
#   scripts/setup.sh
set -euo pipefail
cd "$(dirname "$0")/.."
command -v ffmpeg >/dev/null || { echo "ffmpeg missing: Mac 'brew install ffmpeg', Linux 'sudo apt install ffmpeg'"; exit 1; }
npm install --silent
pip install -q -r requirements.txt 2>/dev/null || pip install -q --break-system-packages -r requirements.txt
mkdir -p models/kokoro
for f in kokoro-v1.0.onnx voices-v1.0.bin; do
  [ -s "models/kokoro/$f" ] || curl -sSL -o "models/kokoro/$f" "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/$f"
done
./scripts/install_skills.sh
echo "Ready. Test: node render.mjs episodes/guy-fawkes-guys still 0"
