"""Voice: Kokoro TTS, voice af_heart, speed 1.0, phrase by phrase (exact caption timing).

Never change the speech speed - only the pauses between phrases.
  python audio/voice_kokoro.py episodes/<slug>
reads  script.json  {"phrases": [{"text": "...", "start": optional pinned seconds}, ...]}
writes narration.wav + caps_raw.json [{"text", "start", "end"}]
Model files (GitHub release, Hugging Face may be blocked): see CLAUDE.md section 7.
"""
import json
import os
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

VOICE, LANG, SPEED = "af_heart", "en-us", 1.0  # hard rule - do not change
GAP_COMMA, GAP_FULL, OUTRO = 0.12, 0.30, 2.0
SR = 24000
MODEL_DIR = Path(os.getenv("KOKORO_DIR", Path(__file__).resolve().parent.parent / "models" / "kokoro"))


def _kokoro():
    from kokoro_onnx import Kokoro

    onnx, voices = MODEL_DIR / "kokoro-v1.0.onnx", MODEL_DIR / "voices-v1.0.bin"
    if not onnx.exists():
        sys.exit(f"Kokoro model not found in {MODEL_DIR}. Run scripts/setup.sh (or set KOKORO_DIR).")
    return Kokoro(str(onnx), str(voices))


def trim(x: np.ndarray, thr: float = 0.01) -> np.ndarray:
    """Trim leading/trailing silence so caption timings are exact."""
    idx = np.where(np.abs(x) > thr)[0]
    if len(idx) == 0:
        return x
    a, b = max(0, idx[0] - int(0.02 * SR)), min(len(x), idx[-1] + int(0.04 * SR))
    return x[a:b]


def synth(episode: Path) -> dict:
    script = json.loads((episode / "script.json").read_text())
    phrases = script["phrases"]
    k = _kokoro()
    out, caps, t = [], [], 0.0
    for i, ph in enumerate(phrases):
        audio, sr = k.create(ph["text"], voice=VOICE, speed=SPEED, lang=LANG)
        assert sr == SR
        audio = trim(np.asarray(audio, dtype=np.float32))
        start = t
        if ph.get("start") is not None and ph["start"] > t:  # pinned to an animation beat
            start = float(ph["start"])
        if start > t:
            out.append(np.zeros(int(round((start - t) * SR)), np.float32))
        out.append(audio)
        end = start + len(audio) / SR
        caps.append({"text": ph.get("caption", ph["text"]), "start": round(start, 3), "end": round(end, 3)})
        gap = GAP_COMMA if ph["text"].rstrip().endswith(",") else GAP_FULL
        if i == len(phrases) - 1:
            gap = OUTRO
        out.append(np.zeros(int(round(gap * SR)), np.float32))
        t = end + gap
    wav = np.concatenate(out)
    peak = float(np.max(np.abs(wav))) or 1.0
    wav = wav * (0.9 / peak)  # normalise to 0.9 peak
    sf.write(episode / "narration.wav", wav, SR)
    (episode / "caps_raw.json").write_text(json.dumps(caps, indent=2))
    dur = len(wav) / SR
    words = sum(len(p["text"].split()) for p in phrases)
    print(f"[voice] {len(phrases)} phrases, {words} words, {dur:.2f}s ({words / max(dur - OUTRO, 0.1):.2f} words/s)")
    if dur > 30.5:
        print("[voice] WARNING: over 30s - trim the script (rule: 20-30s).")
    return {"duration": dur, "caps": caps}


if __name__ == "__main__":
    synth(Path(sys.argv[1]))
