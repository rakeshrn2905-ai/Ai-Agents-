"""Procedural SFX (numpy): whoosh, tick, chime, scratch, snare, pop, thud, flame, strike."""
import numpy as np

SR = 44100
rng = np.random.default_rng(7)


def _env(n, a=0.005, r=0.2):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / max(r, 1e-4))


def _lp(x, k=0.1):
    y = np.empty_like(x); acc = 0.0
    for i, v in enumerate(x):
        acc += k * (v - acc); y[i] = acc
    return y


def whoosh(d=0.35):
    n = int(d * SR); t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    sweep = np.sin(np.pi * t / d) ** 2
    k = 0.02 + 0.25 * (t / d)
    y = np.empty(n); acc = 0.0
    for i in range(n):  # sweeping low-pass
        acc += k[i] * (noise[i] - acc); y[i] = acc
    return 0.9 * y * sweep / (np.max(np.abs(y)) + 1e-9)


def tick():
    n = int(0.06 * SR); t = np.arange(n) / SR
    return 0.6 * np.sin(2 * np.pi * 2400 * t) * _env(n, 0.001, 0.012)


def chime():
    n = int(1.2 * SR); t = np.arange(n) / SR
    y = sum(a * np.sin(2 * np.pi * f * t) for f, a in [(1318.5, 1), (1975.5, 0.5), (2637, 0.25)])
    return 0.35 * y * _env(n, 0.003, 0.4)


def scratch():
    n = int(0.25 * SR); noise = rng.standard_normal(n)
    hp = noise - _lp(noise, 0.3)
    return 0.5 * hp * _env(n, 0.01, 0.08) * (1 + 0.5 * np.sin(np.arange(n) / SR * 2 * np.pi * 30))


def snare():
    n = int(0.25 * SR); t = np.arange(n) / SR
    body = np.sin(2 * np.pi * 190 * t) * _env(n, 0.001, 0.05)
    return 0.7 * (0.5 * body + 0.6 * rng.standard_normal(n) * _env(n, 0.001, 0.07))


def pop():
    n = int(0.12 * SR); t = np.arange(n) / SR
    f = 900 * np.exp(-t * 30) + 300
    return 0.7 * np.sin(2 * np.pi * np.cumsum(f) / SR) * _env(n, 0.001, 0.03)


def thud():
    n = int(0.5 * SR); t = np.arange(n) / SR
    f = 120 * np.exp(-t * 8) + 45
    return 1.0 * np.sin(2 * np.pi * np.cumsum(f) / SR) * _env(n, 0.002, 0.15) + 0.15 * rng.standard_normal(n) * _env(n, 0.001, 0.02)


def flame():
    n = int(0.7 * SR); noise = rng.standard_normal(n)
    return 0.6 * _lp(noise, 0.05) * 6 * _env(n, 0.02, 0.25)


def strike():
    return np.concatenate([scratch(), flame()[: int(0.5 * SR)]])


SFX = {"whoosh": whoosh, "tick": tick, "chime": chime, "scratch": scratch, "snare": snare,
       "pop": pop, "thud": thud, "shake": thud, "flame": flame, "strike": strike}


def make(name: str) -> np.ndarray:
    if name not in SFX:
        raise KeyError(f"unknown sfx '{name}' (have: {', '.join(SFX)})")
    return SFX[name]().astype(np.float32)
