"""Sound: lo-fi bed (numpy) ~18 dB under the voice, sidechain-ducked under speech,
plus one SFX per action at the beat times from beats.json -> mix.wav (44.1 kHz stereo).
  python audio/mix.py episodes/<slug>
"""
import json
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

sys.path.insert(0, str(Path(__file__).resolve().parent))
from sfx import SR, make  # noqa: E402

BED_DB = -18.0      # bed level relative to voice peak
DUCK_DB = -6.0      # extra reduction while speech is playing
BPM = 78
rng = np.random.default_rng(3)


def db(x):
    return 10 ** (x / 20)


def _note(f, n, kind="keys"):
    t = np.arange(n) / SR
    if kind == "keys":  # soft electric-piano-ish: sine + 2nd harmonic, tremolo, slow decay
        y = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 3)
        return y * np.exp(-t * 1.2) * (1 + 0.15 * np.sin(2 * np.pi * 4.5 * t))
    if kind == "bass":
        return np.tanh(1.5 * np.sin(2 * np.pi * f * t)) * np.exp(-t * 2.2)
    raise ValueError(kind)


def lofi(dur: float) -> np.ndarray:
    """Lo-fi loop: Fmaj7 - Em7 - Dm7 - Cmaj7, boom-bap drums, vinyl crackle, warm low-pass."""
    n = int(dur * SR) + SR
    beat = 60 / BPM; bar = 4 * beat
    out = np.zeros(n)
    chords = [[174.6, 220.0, 261.6, 329.6], [164.8, 196.0, 246.9, 293.7], [146.8, 174.6, 220.0, 261.6], [130.8, 164.8, 196.0, 246.9]]
    roots = [87.3, 82.4, 73.4, 65.4]
    b = 0
    while b * bar < dur + 1:
        s = int(b * bar * SR); ch = chords[b % 4]
        L = min(int(bar * SR), n - s)
        if L <= 0:
            break
        for f in ch:
            out[s:s + L] += 0.12 * _note(f, L)
        out[s:s + L] += 0.25 * _note(roots[b % 4], L, "bass")
        for k in range(4):  # drums
            p = s + int(k * beat * SR)
            if p >= n:
                continue
            if k in (0, 2):
                kick = make("thud")[: int(0.3 * SR)] * 0.55
                out[p:p + len(kick)] += kick[: n - p]
            else:
                sn = make("snare") * 0.35
                out[p:p + len(sn)] += sn[: n - p]
            for h in (0, 0.5):  # swung hats
                q = p + int((h + (0.08 if h else 0)) * beat * SR)
                hat = rng.standard_normal(int(0.03 * SR)) * np.exp(-np.arange(int(0.03 * SR)) / (0.006 * SR)) * 0.08
                if q < n:
                    out[q:q + len(hat)] += hat[: n - q]
        b += 1
    # warm low-pass (one-pole, vectorised via cumulative filter in blocks)
    k = 0.18; y = np.empty_like(out); acc = 0.0
    for i in range(0, n, 4096):
        blk = out[i:i + 4096]; res = np.empty_like(blk)
        for j, v in enumerate(blk):
            acc += k * (v - acc); res[j] = acc
        y[i:i + 4096] = res
    crackle = (rng.random(n) > 0.9993) * rng.standard_normal(n) * 0.3 + rng.standard_normal(n) * 0.004
    y = y + crackle
    return (y / (np.max(np.abs(y)) + 1e-9))[: int(dur * SR)]


def duck_env(voice: np.ndarray) -> np.ndarray:
    """Smooth envelope: 1 when silent, DUCK when speech is present (20 ms attack, 250 ms release)."""
    win = int(0.02 * SR)
    rms = np.sqrt(np.convolve(voice ** 2, np.ones(win) / win, mode="same"))
    speech = (rms > 0.02).astype(float)
    env = np.empty_like(speech); g = 1.0
    att, rel = 1 - np.exp(-1 / (0.02 * SR)), 1 - np.exp(-1 / (0.25 * SR))
    target_low = db(DUCK_DB)
    for i, sp in enumerate(speech):
        tgt = target_low if sp else 1.0
        g += (att if tgt < g else rel) * (tgt - g)
        env[i] = g
    return env


def resample(x, sr_in, sr_out):
    if sr_in == sr_out:
        return x
    n_out = int(len(x) * sr_out / sr_in)
    return np.interp(np.linspace(0, len(x) - 1, n_out), np.arange(len(x)), x)


def mix(episode: Path) -> Path:
    voice, vsr = sf.read(episode / "narration.wav")
    if voice.ndim > 1:
        voice = voice.mean(axis=1)
    voice = resample(voice, vsr, SR)
    beats = json.loads((episode / "beats.json").read_text())
    dur = max(beats["duration"], len(voice) / SR)
    n = int(dur * SR)
    voice = np.pad(voice, (0, max(0, n - len(voice))))[:n]
    vpk = np.max(np.abs(voice)) or 1.0
    voice = voice * (0.9 / vpk)

    bed = lofi(dur)[:n]
    bed = np.pad(bed, (0, n - len(bed))) * 0.9 * db(BED_DB) * duck_env(voice)
    fx = np.zeros(n)
    for b in beats["beats"]:
        for s in b.get("sfx", []):
            p = int((b["start"] + s.get("at", 0)) * SR)
            snd = make(s["type"]) * db(s.get("db", -8))
            if p < n:
                fx[p:p + len(snd)] += snd[: n - p]
    out = voice + bed + fx
    # gentle fades + limiter
    f = int(0.05 * SR); out[:f] *= np.linspace(0, 1, f); out[-int(0.4 * SR):] *= np.linspace(1, 0, int(0.4 * SR))
    pk = np.max(np.abs(out))
    if pk > 0.98:
        out *= 0.98 / pk
    sf.write(episode / "mix.wav", np.stack([out, out], axis=1).astype(np.float32), SR)
    sf.write(episode / "bed_only.wav", bed.astype(np.float32), SR)  # for QA level checks
    print(f"[sound] mix.wav {dur:.2f}s, {sum(len(b.get('sfx', [])) for b in beats['beats'])} SFX")
    return episode / "mix.wav"


if __name__ == "__main__":
    mix(Path(sys.argv[1]))
