# YouTube Content Agents

Four agents that take you from "I have a niche" to "the video is on my channel":

| # | Agent | File | What it does |
|---|-------|------|--------------|
| 1 | **Trend Researcher** | `youtube_agents/research_agent.py` | Pulls the top videos from the last N days in your niche from the YouTube Data API (views, views/day, likes, comments, tags). Claude then analyses what's working and which title formulas repeat, finds gaps nobody covers well, and ranks 5 video ideas by opportunity. |
| 2 | **Script Writer** | `youtube_agents/script_agent.py` | Writes the full package: scroll-stopping hook, narrated script sections, a catchy title plus alternatives, SEO description, tags, hashtags, thumbnail text and category. |
| 3 | **Video Builder** | `youtube_agents/video_agent.py` | Generates a voiceover per section, designs a slide per section, renders everything to an MP4 with ffmpeg (1920x1080 or 1080x1920 for Shorts), and makes a 1280x720 thumbnail. |
| 4 | **Uploader** | `youtube_agents/upload_agent.py` | Uploads to your channel over OAuth (resumable upload), sets title, description, tags and thumbnail, and can schedule publishing. **Private by default.** |

Every run saves its output to `runs/<timestamp>-<niche>/`: `research.json`, `trending.json`, `package.json`, `video.mp4`, `thumbnail.jpg` and `upload.json`. You can edit `package.json` by hand before building or uploading.

## Setup

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# ffmpeg is required: macOS `brew install ffmpeg`, Ubuntu `sudo apt install ffmpeg`, Windows: ffmpeg.org
cp .env.example .env   # then fill in the keys
```

1. **`ANTHROPIC_API_KEY`**: get one at console.anthropic.com. Used by agents 1 and 2.
2. **`YOUTUBE_API_KEY`** (agent 1): Google Cloud Console → create a project → enable **YouTube Data API v3** → Credentials → *API key*. Without it, agent 1 falls back to Claude's general knowledge and doesn't use live data.
3. **Upload setup** (agent 4): in the same project, configure the OAuth consent screen and add yourself as a test user. Then go to Credentials → *OAuth client ID* → **Desktop app**, download the JSON and save it as `client_secret.json` in the project root. The first upload opens a browser so you can authorise your channel, and the token is saved to `token.json`.

## Usage

```bash
# Run all four agents. The upload is PRIVATE so you can review it in YouTube Studio first.
python -m youtube_agents run --niche "personal finance for college students"

# Make a Short, build it, but don't upload yet
python -m youtube_agents run --niche "AI tools for small business" --format shorts --no-upload

# Run one agent at a time
python -m youtube_agents research --niche "home workouts" --minutes 8
python -m youtube_agents script runs/<run-id> --idea 2        # pick a different idea
python -m youtube_agents build  runs/<run-id>
python -m youtube_agents upload runs/<run-id> --privacy unlisted
python -m youtube_agents upload runs/<run-id> --publish-at 2026-11-10T15:00:00Z   # scheduled
```

## Notes

- **Model:** Claude Opus 5.5 (`claude-opus-5-5`) with adaptive thinking and validated structured output. You can override it with `CLAUDE_MODEL`. Server-side refusal fallback is on, so a request declined by a safety classifier is retried on a fallback model automatically.
- **Voiceover:** uses Google TTS (`gTTS`, free, needs internet). If that fails, it uses `espeak-ng` if installed, and otherwise silent audio so you can still preview the layout. For a more natural voice, swap `tts()` in `video_agent.py` for ElevenLabs or a similar service.
- **YouTube API quota:** the default quota is 10,000 units a day. A research run costs about 101 units and an upload about 1,600, so you get roughly 6 uploads a day.
- **Custom thumbnails** only work on channels with a verified phone number (youtube.com/verify).
- Unverified Google Cloud apps can only upload as **private** until the app passes YouTube's API audit. This is a YouTube rule.
- Follow YouTube's policies on repetitive and AI-generated content. Review each video before you make it public.
