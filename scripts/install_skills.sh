#!/usr/bin/env bash
# Install the /yt-* skills (github.com/Jakeschincariol/youtube-agent-skill, MIT) globally and the
# Time Sketch voice profile they all read. The repo copy in .claude/skills/ already works
# project-locally; this is only needed to use them outside this repo.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p ~/.claude/skills ~/.claude/youtube
cp -r .claude/skills/yt-* ~/.claude/skills/
cp brand/voice.md ~/.claude/youtube/voice.md
echo "Installed $(ls -d .claude/skills/yt-* | wc -l) skills and ~/.claude/youtube/voice.md"
