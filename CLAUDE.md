# Time Sketch - Shorts pipeline

Owner: Rakesh (UK, Europe/London). Channel: Time Sketch (@TimeSketch), Past · Present · Future,
UK/US teens and adults, not made for kids, category Education. 2 Shorts a day at 07:00 and 17:00 UK.
Target: 60%+ "stayed to watch" (baseline 46%, #6 Lighters Came Before Matches), 80% long-term.

## Workflow (always)

1. **Claude proposes topics** in `docs/TOPICS.md` (5+ options across the pillars, each with a hook and a fact-confidence note).
2. **Rakesh picks.** Never build a video he hasn't picked.
3. **Claude builds it:** fact-check (2+ sources) -> script -> storyboard -> voice -> animation -> sound -> QA + detail check
   -> title/description/tags -> `--manual` upload pack. Sends final.mp4 + upload_pack.md + thumbnail.
4. **Rakesh uploads** in YouTube Studio at the booked slot and sends the link.
5. **After 48 h** Rakesh sends the Studio numbers; Claude logs them and picks ONE change for the next video.

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

## 80% playbook ("stayed to watch" is decided in the first second)

`python3 -m timesketch.qa episodes/<slug>` enforces the measurable ones; the publisher refuses a FAIL.
1. **Frame 1 sells it:** bright, colourful set (QA: brightness >= 140, saturation >= 90; never open on a dark
   scene), the big title fully on screen at 0.0 s (the engine pre-lands the hook title), characters already
   moving and in frame (slam starts inside the frame). Picture first, words second.
2. **One text at a time in the hook:** no caption under the hook title.
3. **Hook <= 2 s, spoken at 0.0 s, aimed at the viewer** ("You say guys because of Guy Fawkes."): a surprising
   claim about something they use or know every day.
4. **Something changes every 2-4 s:** new beat, camera move, label pop or SFX. No beat over 5.6 s.
5. **Open loop:** the hook's question is only fully paid off at the end.
6. **Seamless loop:** the last frame looks like the first (QA checks it), so replays count.
7. **Stop-the-scroll extras (from #9):** camera `punchout` (frame 1 starts tight and pulls back), an odd pairing in
   frame 1, a split hook whose sentence finishes after the swipe decision, and a closing question the hook answers.
8. **Test ONE change per video** and log it in the results table below; keep what moves the number.
   80% is top-tier for Shorts, so expect to climb towards it over several videos, not in one jump.

## Detail check (look at full-size frames from final.mp4, every beat, before handing over)

- Limbs: legs never crossed (X), knees and elbows bend outward, elbows hang down; walking feet stay on their own side.
- Hands: a held prop touches the hand (lantern handle in the palm), nothing floats.
- Contrast: thin black limbs never sit on a dark background (light the arches/doorways behind characters).
- Text: titles never cover faces or hats, including during camera push-ins; labels stay attached to their boxes.
- Framing: nothing important cut at the frame edge after the camera zoom.
- Taste: effigies, injuries or danger read clearly as cartoon objects (stitched dummy, not a person).
- Props and sets: no clutter overlapping a character's face or the main prop.

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
| 8. QA | `python3 -m timesketch.qa <ep>` + `node scripts/cast_sheet.mjs <ep> cast.png` + the detail check below | full decode, format, length, frame-1 gates, motion, hook timing, beat length, SFX, loop, black edges, levels, clipping -> qa.json |
| 9. Title / thumbnail / description | `/yt-package` + `/yt-seo` | `title.py` lint; thumbnail = a frame from the hook, <= 3 words, different from the title. No chapters (Shorts). |
| 10. Upload + publish | `publisher` agent -> on the Mac: Claude in Chrome fills YouTube Studio from `--manual`'s upload pack and schedules it (confirm first), or `python3 -m timesketch.publish <ep> --make` (Make.com scenario via a Google-Drive-synced `MAKE_OUTBOX`, see docs/MAKE.md); `--sync` records video IDs; `--manual` = Studio upload pack | No Google Cloud. Preflight, next free 07:00 / 17:00 UK slot, Education, not made for kids. Always confirm with Rakesh before queueing. |
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
python3 -m timesketch.qa $E               # after mux: technical + retention gates -> qa.json
python3 audio/mix.py $E                   # mix.wav
scripts/mux.sh $E                         # final.mp4 (video untouched, 384k audio) + decode check
ffmpeg -v error -i $E/final.mp4 -f null -   # full decode check
python3 -m timesketch.publish $E --make --dry-run  # then without --dry-run to queue it for Make
```

## Results log

| # | Video | Format | Length | Stayed to watch | Change tested |
|---|---|---|---|---|---|
| 1 | Why a Week Has 7 Days | Host Tempo, slow opening | 26 s | 27.6% | |
| 2 | Oxford Is Older Than the Aztec Empire | Host Clio, split screen | 17.6 s | 47% (~1.2k views) | |
| 3 | Mammoths Saw the Pyramids | Host Clio | 17.8 s | 38% (~1.1k views) | |
| 4 | Sharks Are Older Than Trees | Host Clio, split screen | 14.4 s | n/a | |
| 5 | Fax (old style) | Host Clio | - | n/a | |
| 6 | Lighters Came Before Matches | No host, hook -> how -> why | 28.8 s | 46%, +2 subs | first no-host explainer |
| 7 | 'Guys' Comes From a 1605 Gunpowder Plot (5 Nov 07:00) | No host, hook -> how -> why | 24.4 s | (fill in after 48 h) | bright frame 1 + title at 0.0 s + 'you' hook + no hook caption |
| 8 | Cans Came 40 Years Before Can Openers (5 Nov 17:00) | No host, hook -> how -> why | 23.3 s | (fill in after 48 h) | same frame-1 rules; 'which came first' topic (pairs with #6) |
| 9 | Cleopatra Was Closer to 1969 Than the Pyramids (6 Nov 17:00) | No host, time gap | 26.4 s | (fill in after 48 h) | 90% push: punch-out frame 1, odd pair (Cleopatra + astronaut), split hook, question loop |
| 10 | Some Clocks Will Hit 1901 in 2038 (7 Nov 07:00) | No host, Future pillar explainer | 27.8 s | (fill in after 48 h) | first Future-pillar video; same 90% push (punch-out, split hook, odd visual: computer in a 1901 top hat) |
| 11 | Your Keyboard Is 150 Years Old (7 Nov 17:00) | No host, Present pillar explainer | 24.4 s | (fill in after 48 h) | first topic Rakesh picked (T10); 1.6 s 'Victorian' hook; odd pair keyboard + monocled typewriter |
| 12 | Ancient Rome Had a Pee Tax (8 Nov 07:00) | BRAIN-ROT TEST: 10 beats in 20 s, punch-in + shake + SFX every beat | 20.1 s | (fill in after 48 h) | brain-rot pacing vs normal explainers (B5, picked by Rakesh) |

Lessons: a slow first frame kills retention; a bright picture-first hook helps; the explainer format
earned the first subscribers. Retired: hosts Tempo and Clio, voices Michael and Tock.

## Setup (fresh machine or new session)

`scripts/setup.sh`, then read docs/NEXT.md (where we left off; update it at the end of each session). Details: docs/SETUP.md (tools, Kokoro model, skills) and docs/MAKE.md (uploads).
