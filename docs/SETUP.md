# Time Sketch pipeline - setup, step by step

Do parts 1-6 once on your own computer (Windows, Mac or Linux). Part 7 is only for Claude Code cloud sessions.

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
```

## 3. Download the Kokoro voice model (about 350 MB, one time)

```bash
mkdir -p models/kokoro && cd models/kokoro
curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
cd ../..
```

Then install the /yt-* skills and the voice profile globally (optional, they already work inside this folder):

```bash
./scripts/install_skills.sh        # Windows: run it from Git Bash
```

**Test:** build the demo episode. It should end with `episodes/lighters-before-matches/final.mp4` (about 27 s).

```bash
E=episodes/lighters-before-matches
python3 audio/voice_kokoro.py $E && python3 -m timesketch.timing $E
node render.mjs $E video && python3 audio/mix.py $E
ffmpeg -y -i $E/video_noaudio.mp4 -i $E/mix.wav -c:v copy -c:a aac -b:a 192k -shortest $E/final.mp4
```

## 4. Google Cloud: one project for uploads, analytics and competitor research (free)

Sign in to console.cloud.google.com with the Google account that **manages the Time Sketch Brand Account**.

1. **Create a project:** project picker (top bar) -> New project -> name it `Time Sketch` -> Create -> select it.
2. **Turn on two APIs:** APIs & Services -> Library -> search **YouTube Data API v3** -> Enable. Go back and do the
   same for **YouTube Analytics API**. Both are needed.
3. **Consent screen:** APIs & Services -> OAuth consent screen (it may open as "Google Auth Platform"):
   - Get started -> App name `Time Sketch Uploader`, your email as support and developer contact -> Audience **External** -> Create.
   - Audience -> Test users -> **Add users** -> your Google account.
   - Recommended: Audience -> **Publish app** (to "In production"). In "Testing" mode your login expires every 7 days.
     In production it keeps working; Google shows an "unverified app" warning at login, which is fine for your own use.
4. **Login file for uploads + analytics:** Clients (or Credentials -> Create credentials -> OAuth client ID) ->
   Application type **Desktop app** -> name `Time Sketch desktop` -> Create -> **Download JSON**.
   Rename it to `client_secret.json` and put it in the project folder (next to `CLAUDE.md`). Git ignores it.
5. **API key for competitor research:** Credentials -> Create credentials -> **API key** -> Edit key ->
   API restrictions -> Restrict key -> tick **YouTube Data API v3** -> Save. Copy the key. Never commit it or paste it in chat.

## 5. Connect your channel (first login)

```bash
python3 -m timesketch.analytics
```

1. A browser opens. Pick your Google account.
2. **Pick the Time Sketch channel** (the Brand Account), not your personal channel.
3. If you see "Google hasn't verified this app": Advanced -> Go to Time Sketch Uploader (unsafe) -> Continue. It's your own app.
4. Tick every permission -> Continue. `token.json` is saved (git-ignored). The terminal prints your videos.
   If the titles are not Time Sketch's, delete `token.json` and log in again choosing the right channel.

Competitor research on your computer:

```bash
export YOUTUBE_API_KEY=your-key        # Windows PowerShell: $env:YOUTUBE_API_KEY="your-key"
python3 -m timesketch.competitors
```

## 6. Upload and publish

```bash
python3 -m timesketch.publish episodes/<slug> --dry-run    # checks only
python3 -m timesketch.publish episodes/<slug>              # uploads, schedules next 07:00 / 17:00 UK slot
```

Or in Claude Code just say "upload it" and the `publisher` agent writes the title/description, checks
everything and asks you before uploading.

**Private lock (important):** YouTube makes every upload from a new, unaudited API project **private**.
Until the audit is approved, open YouTube Studio after each upload and press Schedule / Publish yourself.
To remove the lock: search "YouTube API Services Audit and Quota Extension Form", fill it in for project
`Time Sketch` (purpose: uploading your own channel's videos). Approval can take a few weeks.

## 7. Claude Code cloud sessions (claude.ai/code)

- Add the API key: cloud environment menu in the session title bar -> **Edit** -> Network secrets (or
  environment variables) -> name **`YOUTUBE_API_KEY`**, value = your key. New sessions pick it up.
- The browser login (part 5) can't run in the cloud, so do uploads and analytics from your own computer.
  Cloud sessions can still build videos and run competitor research.

## 8. Everyday use (in Claude Code, in the project folder)

| Say | What happens |
|---|---|
| "research competitors" | `timesketch.competitors` + `/yt-viral` |
| "plan this week" | `/yt-plan` |
| "make the can opener Short" | facts -> `/yt-script` -> storyboard -> voice -> animation -> mix -> QA stills |
| "upload it" | `publisher` agent -> scheduled for the next free slot |
| "check analytics" (after 48 h) | `timesketch.analytics` + `/yt-retention` + `/yt-audit`, one change for the next video |
| "reply to comments" | `/yt-comment` |

Also add each Short's **stayed to watch %** from YouTube Studio (the Short -> Analytics -> Engagement) to
`analytics/results.csv`. The API doesn't provide it.

## Other accounts

- **vidIQ:** connected as rakstar62@gmail.com. Check it's the account that owns Time Sketch. Free plan: the tools here never spend credits.
- **Supermetrics:** free trial ended 3 Nov 2026. Not needed (part 4 replaces it).
