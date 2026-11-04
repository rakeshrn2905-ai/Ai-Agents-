# Time Sketch: Shorts pipeline (work in progress)

Style 5 historical-cartoon Shorts, drawn and animated in code (Node canvas), voiced with
Kokoro `af_heart`, mixed with a numpy lo-fi bed and rendered locally with ffmpeg. No external video AI.

## Status
Working: drawing library (`lib/`), object characters + Style 5 humans, painted sets, scene library
(hook, explain, cutaway, timeline, reveal, payoff), camera / whip-pans / shake, titles and captions at y=1500,
loop ending, Kokoro voice (`audio/voice_kokoro.py`), SFX + ducked lo-fi mix (`audio/mix.py`),
timing resolver (`timesketch/timing.py`). Demo episode: `episodes/lighters-before-matches/`.

Planning, scripting, packaging, SEO, comments and analytics use the `/yt-*` skills in `.claude/skills/`
(from Jakeschincariol/youtube-agent-skill, MIT). See CLAUDE.md for the stage-by-stage mapping.
Uploading: Make.com via a synced outbox folder, no Google Cloud (docs/MAKE.md): `python3 -m timesketch.publish episodes/<slug> --make`.
Still to build: fact-check researcher, storyboarder and QA reviewer.

**New machine? Follow [docs/SETUP.md](docs/SETUP.md) step by step.**

## Build one episode
```bash
npm install
pip install kokoro-onnx soundfile numpy
# Kokoro model files -> models/kokoro/ (kokoro-v1.0.onnx, voices-v1.0.bin from the
# thewh1teagle/kokoro-onnx GitHub release "model-files-v1.0")
E=episodes/lighters-before-matches
python3 audio/voice_kokoro.py $E      # narration.wav + caps_raw.json
python3 -m timesketch.timing $E       # storyboard.json -> beats.json
node render.mjs $E still              # QA stills
node render.mjs $E video              # video_noaudio.mp4
python3 audio/mix.py $E               # mix.wav
ffmpeg -i $E/video_noaudio.mp4 -i $E/mix.wav -c:v copy -c:a aac -b:a 192k -shortest $E/final.mp4
```

