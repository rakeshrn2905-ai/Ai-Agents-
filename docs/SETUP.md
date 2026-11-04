# Time Sketch pipeline - setup, step by step (no Google Cloud)

Everything here is free. Do it once on your own computer (Windows, Mac or Linux).

## 1. Install the tools

| Tool | Get it | Check it works |
|---|---|---|
| Git | git-scm.com | `git --version` |
| Python 3.10+ | python.org (Windows: tick "Add to PATH") | `python3 --version` (Windows: `python --version`) |
| Node.js 20+ | nodejs.org (LTS) | `node --version` |
| ffmpeg | Mac `brew install ffmpeg` · Windows `winget install ffmpeg` · Linux `sudo apt install ffmpeg` | `ffmpeg -version` |
| Claude Code | code.claude.com | `claude --version` |

## 2. Get the project

```bash
git clone https://github.com/rakeshrn2905-ai/Ai-Agents-.git
cd Ai-Agents-
git checkout claude/youtube-content-agents-lay9m8
npm install
pip install -r requirements.txt
pip install yt-dlp            # competitor research (reads public YouTube pages, no key)
```

## 3. Download the Kokoro voice model (about 350 MB, one time)

```bash
mkdir -p models/kokoro && cd models/kokoro
curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
cd ../..
./scripts/install_skills.sh        # Windows: run from Git Bash
```

**Test:** build the demo episode. It should end with `episodes/lighters-before-matches/final.mp4` (about 27 s).

```bash
E=episodes/lighters-before-matches
python3 audio/voice_kokoro.py $E && python3 -m timesketch.timing $E
node render.mjs $E video && python3 audio/mix.py $E
ffmpeg -y -i $E/video_noaudio.mp4 -i $E/mix.wav -c:v copy -c:a aac -b:a 192k -shortest $E/final.mp4
```

## 4. Automatic uploads: Make.com + Google Drive for desktop

Follow **[docs/MAKE.md](MAKE.md)**, about 20 minutes: install Drive for desktop, make the outbox folder,
build the Make scenario, run one private test.

Fallback with no automation: `python3 -m timesketch.publish episodes/<slug> --manual` writes `upload_pack.md`
with everything to copy into YouTube Studio's Schedule screen.

## 5. Analytics (YouTube Studio exports)

After a Short has been out 48 hours:

1. studio.youtube.com -> Analytics -> **Advanced mode** -> Content: Shorts -> export (top right) -> **CSV**.
   Save the file into `analytics/` in the project.
2. For each new Short: open it in Analytics -> Engagement -> the audience-retention chart -> download.
   Save it into `analytics/` too.
3. Note each Short's **stayed to watch %** (the Short's Analytics -> Engagement / "Viewed vs swiped away").
4. In Claude Code: **"check analytics"**. It reads the files with `/yt-retention` + `/yt-audit`, updates
   `analytics/results.csv` and proposes one change for the next video.

## 6. Competitor research (yt-dlp, free)

In Claude Code: **"research competitors"**. It runs `yt-dlp --flat-playlist -J` on public channel pages (read only,
never logged in) and ranks the results with `/yt-viral`. Or by hand:

```bash
yt-dlp --flat-playlist -J "https://www.youtube.com/@CHANNEL/shorts" > analytics/CHANNEL.json
```

## 7. Everyday use (in Claude Code, in the project folder)

| Say | What happens |
|---|---|
| "research competitors" | yt-dlp + `/yt-viral` |
| "plan this week" | `/yt-plan` |
| "make the can opener Short" | facts -> `/yt-script` -> storyboard -> voice -> animation -> mix -> QA stills |
| "upload it" | `publisher` agent -> Make outbox, goes out at the next free 07:00 / 17:00 slot |
| "sync uploads" | `publish --sync` records the video IDs |
| "check analytics" (after 48 h) | Studio exports + `/yt-retention` + `/yt-audit` |
| "reply to comments" | `/yt-comment` |

## Accounts

- **Make.com** (free) and **Google Drive for desktop** (free): uploads.
- **vidIQ:** connected as rakstar62@gmail.com. Check it's the account that owns Time Sketch. Free plan: the tools here never spend credits.
- Not used: Google Cloud, Supermetrics (trial ended).
