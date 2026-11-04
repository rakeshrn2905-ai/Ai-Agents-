# Time Sketch - Shorts pipeline

Owner: Rakesh (UK, Europe/London). Channel: Time Sketch (@TimeSketch), Past · Present · Future,
UK/US teens and adults, not made for kids, category Education. 2 Shorts a day at 07:00 and 17:00 UK.
Target: 60%+ "stayed to watch" (baseline 46%, #6 Lighters Came Before Matches), 80% long-term.

## Hard rules (these override anything a /yt-* skill says)

1. No Gemini, no external video AI. Every frame is drawn and animated in code (`lib/`, `render.mjs`),
   rendered locally with ffmpeg.
2. Narration is Kokoro `af_heart`, speed 1.0. Never change speech speed, only the pauses.
3. Only checked facts: at least 2 reliable sources per claim in `facts.json`. No made-up quotes or numbers.
4. Clearly cartoon. Re-check if anything looks realistic.
5. No countdowns, no name tags in captions, no "illustration" labels.
6. Captions at y ~ 1500, never at the bottom.
7. vidIQ is on the free plan: never spend vidIQ credits (only 0-credit calls: balance, user_channels, list_competitors).
   No Google Cloud and no Supermetrics (trial expired 2026-11-03). Setup: docs/SETUP.md.

Shorts format: 20-30 s, 9:16 1080x1920 30 fps, ~55-65 words, hook (surprise in ~2 s, title on screen
from 0.0 s, characters already moving) -> how (labelled cutaway) -> why -> payoff ->
"DID YOU KNOW? COMMENT BELOW" -> visual loop back to the hook. One idea per 3-4 s beat, each with its
own visual + SFX. No on-screen host: Style 5 object characters + painted sets.

## Who does what

The /yt-* skills (`.claude/skills/yt-*`, from github.com/Jakeschincariol/youtube-agent-skill, MIT)
replace the planning, writing, packaging and analytics agents. The video/animation stages stay ours.

| Stage | Done by | Notes for Time Sketch |
|---|---|---|
| 1. Topic scout | `yt-dlp --flat-playlist -J` on public channel pages -> `/yt-viral` + `/yt-plan` | Rank by outlier multiple (`swipe.py`). Plan = 14 Shorts/week, not their long-form "anchor" shape. Skip topics already made (results log). |
| 2. Research / fact-check | ours | `facts.json`, 2+ sources per claim, reject hedged claims. |
| 3. Script | `/yt-script` | Use its 21 formulas + `hookscore.py`, but compress to the Shorts shape above: hook <= 2 s, 55-65 words, `[ON SCREEN]` on every beat. Write `script.json` phrases. Its hook score is long-form tuned (it rates the 46% lighters hook WEAK) - one signal, real results win. |
| 4. Storyboard | ours | `storyboard.json`, beats tied to phrase numbers, scenes from `lib/scenes.mjs`. |
| 5. Voice | ours | `python3 audio/voice_kokoro.py episodes/<slug>` |
| 6. Animation | ours | `python3 -m timesketch.timing`, `node render.mjs <ep> still`, then `video` |
| 7. Sound | ours | `python3 audio/mix.py episodes/<slug>`, then ffmpeg mux |
| 8. QA | ours | separate reviewer; full decode, no black edges, text not over faces, levels |
| 9. Title / thumbnail / description | `/yt-package` + `/yt-seo` | `title.py` lint; thumbnail = a frame from the hook, <= 3 words, different from the title. No chapters (Shorts). |
| 10. Upload + publish | `publisher` agent -> `python3 -m timesketch.publish <ep> --make` (Make.com scenario via a Google-Drive-synced `MAKE_OUTBOX`, see docs/MAKE.md); `--sync` records video IDs; `--manual` = Studio upload pack | No Google Cloud. Preflight, next free 07:00 / 17:00 UK slot, Education, not made for kids. Always confirm with Rakesh before queueing. |
| 11. Analytics | YouTube Studio CSV exports in `analytics/` -> `/yt-retention` + `/yt-audit` | Feed the Studio retention CSV after 48 h, update the results log, ONE change per video. |
| Comments | `/yt-comment` | Under 30 words, pin the most-asked question. |

Not used: `/yt-edit`, `/yt-shorts`, `/yt-chapters` - they are for recorded long videos.

## Build one episode

```bash
E=episodes/<slug>
python3 audio/voice_kokoro.py $E          # script.json -> narration.wav + caps_raw.json
python3 -m timesketch.timing $E           # storyboard.json -> beats.json
node render.mjs $E still                  # QA stills, inspect every scene
node render.mjs $E video                  # video_noaudio.mp4
python3 audio/mix.py $E                   # mix.wav
ffmpeg -i $E/video_noaudio.mp4 -i $E/mix.wav -c:v copy -c:a aac -b:a 192k -shortest $E/final.mp4
ffmpeg -v error -i $E/final.mp4 -f null -   # full decode check
python3 -m timesketch.publish $E --make --dry-run  # then without --dry-run to queue it for Make
```

## Results log

| # | Video | Format | Length | Stayed to watch |
|---|---|---|---|---|
| 1 | Why a Week Has 7 Days | Host Tempo, slow opening | 26 s | 27.6% |
| 2 | Oxford Is Older Than the Aztec Empire | Host Clio, split screen | 17.6 s | 47% (~1.2k views) |
| 3 | Mammoths Saw the Pyramids | Host Clio | 17.8 s | 38% (~1.1k views) |
| 4 | Sharks Are Older Than Trees | Host Clio, split screen | 14.4 s | n/a |
| 5 | Fax (old style) | Host Clio | - | n/a |
| 6 | Lighters Came Before Matches | No host, hook -> how -> why | 28.8 s | 46%, +2 subs |

Lessons: a slow first frame kills retention; a bright picture-first hook helps; the explainer format
earned the first subscribers. Retired: hosts Tempo and Clio, voices Michael and Tock.

## Setup (fresh machine)

See docs/SETUP.md (tools, Kokoro model, skills) and docs/MAKE.md (uploads).
