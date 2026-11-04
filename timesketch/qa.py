"""QA reviewer: technical checks + retention gates for the first second (where "stayed to watch" is decided).
Writes episodes/<slug>/qa.json; the publisher refuses an episode whose qa.json says FAIL.

  python3 -m timesketch.qa episodes/<slug>
"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
import soundfile as sf
from PIL import Image

FRAME1_MIN_BRIGHTNESS = 140   # HSV value mean (0-255). Dark openings lose the swipe; #6 lighters was 183.
FRAME1_MIN_SATURATION = 90
MIN_MOTION_0_TO_05 = 6.0      # mean pixel change between 0.0 s and 0.5 s: characters already moving
HOOK_MAX_S = 2.3              # the surprise is said within ~2 s
MAX_BEAT_S = 5.6              # one idea per 3-4 s beat; longer beats are where the slide starts
LEVEL_GAP_DB = (15.0, 23.0)   # voice above music during speech
LOOP_MAX_DIFF = 40.0          # last frame should resemble the first (visual loop back to the hook)


def frame(video: Path, t: float, from_end: bool = False) -> np.ndarray:
    seek = ["-sseof", f"-{t:.3f}"] if from_end else ["-ss", f"{t:.3f}"]
    with tempfile.NamedTemporaryFile(suffix=".png") as f:
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *seek, "-i", str(video), "-frames:v", "1", f.name], check=True)
        return np.asarray(Image.open(f.name).convert("RGB")).astype(float)


def hsv_stats(a: np.ndarray):
    hsv = np.asarray(Image.fromarray(a.astype(np.uint8)).convert("HSV")).astype(float)
    return hsv[..., 2].mean(), hsv[..., 1].mean()


def run(ep: Path) -> dict:
    video = ep / "final.mp4"
    checks = []

    def check(name, ok, detail, hard=True):
        checks.append({"check": name, "pass": bool(ok), "hard": hard, "detail": detail})

    dec = subprocess.run(["ffmpeg", "-v", "error", "-i", str(video), "-f", "null", "-"], capture_output=True, text=True)
    check("full decode", dec.returncode == 0 and not dec.stderr.strip(), dec.stderr.strip()[:120] or "clean")
    pr = json.loads(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                                    "stream=width,height,r_frame_rate:format=duration", "-of", "json", str(video)],
                                   capture_output=True, text=True, check=True).stdout)
    st, dur = pr["streams"][0], float(pr["format"]["duration"])
    check("1080x1920 @ 30fps", (st["width"], st["height"], st["r_frame_rate"]) == (1080, 1920, "30/1"), f"{st['width']}x{st['height']} {st['r_frame_rate']}")
    check("length 20-30 s", 20 <= dur <= 30.5, f"{dur:.1f}s")

    caps = json.loads((ep / "caps_raw.json").read_text())
    beats = json.loads((ep / "beats.json").read_text())["beats"]
    check("voice starts at 0.0 s", caps[0]["start"] <= 0.05, f"{caps[0]['start']}s")
    check(f"hook said within {HOOK_MAX_S}s", caps[0]["end"] <= HOOK_MAX_S, f"'{caps[0]['text']}' ends {caps[0]['end']:.2f}s")
    check("title on screen from frame 1", bool(beats[0].get("title")) and beats[0].get("titleAt", 0) == 0, beats[0].get("title", "no title"))
    longest = max(beats, key=lambda b: b["end"] - b["start"])
    check(f"no beat over {MAX_BEAT_S}s", longest["end"] - longest["start"] <= MAX_BEAT_S,
          f"longest {longest['end'] - longest['start']:.1f}s (phrase {longest.get('phrase')})", hard=False)
    sfx_missing = [b.get("phrase") for b in beats if not b.get("sfx")]
    check("SFX on every beat", not sfx_missing, f"missing on phrases {sfx_missing}" if sfx_missing else "ok")

    f0, f05 = frame(video, 0.0), frame(video, 0.5)
    br, sat = hsv_stats(f0)
    check(f"frame 1 bright (>= {FRAME1_MIN_BRIGHTNESS})", br >= FRAME1_MIN_BRIGHTNESS, f"brightness {br:.0f}")
    check(f"frame 1 colourful (>= {FRAME1_MIN_SATURATION})", sat >= FRAME1_MIN_SATURATION, f"saturation {sat:.0f}")
    motion = np.abs(f0 - f05).mean()
    check("motion in the first 0.5 s", motion >= MIN_MOTION_0_TO_05, f"change {motion:.1f}")
    last = frame(video, 0.1, from_end=True)
    loopd = np.abs(last - f0).mean()
    check("ending loops back to the hook", loopd <= LOOP_MAX_DIFF, f"first/last difference {loopd:.1f}", hard=False)

    black = 0
    for t in np.arange(0.2, dur, 1.0):
        a = frame(video, t).mean(axis=2)
        black += sum((s < 8).mean() > 0.5 for s in (a[:6], a[-6:], a[:, :6], a[:, -6:]))
    check("no black edges", black == 0, f"{black} edge hits")

    v, vsr = sf.read(ep / "narration.wav")
    b, bsr = sf.read(ep / "bed_only.wav")
    v = np.interp(np.linspace(0, len(v) - 1, int(len(v) * bsr / vsr)), np.arange(len(v)), v)
    n = min(len(v), len(b)); win = int(0.05 * bsr)
    sp = [i for i in range(0, n - win, win) if np.sqrt(np.mean(v[i:i + win] ** 2)) > 0.03]
    rms = lambda x: np.sqrt(np.mean(np.concatenate([x[i:i + win] for i in sp]) ** 2))
    gap = 20 * np.log10(rms(v[:n]) / max(rms(b[:n]), 1e-9))
    check(f"voice {LEVEL_GAP_DB[0]:.0f}-{LEVEL_GAP_DB[1]:.0f} dB over music", LEVEL_GAP_DB[0] <= gap <= LEVEL_GAP_DB[1], f"{gap:.1f} dB")
    mix, _ = sf.read(ep / "mix.wav")
    check("no clipping", np.abs(mix).max() < 0.999, f"peak {20 * np.log10(np.abs(mix).max()):.1f} dBFS")

    ok = all(c["pass"] for c in checks if c["hard"])
    result = {"pass": ok, "checks": checks,
              "note": "Automated only. A human still watches the stills and listens once."}
    (ep / "qa.json").write_text(json.dumps(result, indent=2))
    for c in checks:
        mark = "PASS" if c["pass"] else ("FAIL" if c["hard"] else "WARN")
        print(f"  {mark:4}  {c['check']:<34} {c['detail']}")
    print(f"[qa] {'PASS' if ok else 'FAIL'} -> {ep / 'qa.json'}")
    return result


if __name__ == "__main__":
    sys.exit(0 if run(Path(sys.argv[1]))["pass"] else 1)
