#!/usr/bin/env bash
# Mux the master: copy the video stream untouched, audio as AAC-LC 48 kHz 384 kbps stereo
# (YouTube's recommended upload audio). Then run a full decode check.
#   scripts/mux.sh episodes/<slug>
set -euo pipefail
E="${1:?usage: scripts/mux.sh episodes/<slug>}"
ffmpeg -y -loglevel error -i "$E/video_noaudio.mp4" -i "$E/mix.wav" \
  -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 384k -ar 48000 -ac 2 -shortest -movflags +faststart "$E/final.mp4"
ffmpeg -v error -i "$E/final.mp4" -f null - && echo "final.mp4 OK: $(du -h "$E/final.mp4" | cut -f1)"
