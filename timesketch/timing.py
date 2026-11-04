"""Resolve storyboard.json (beats tied to phrase numbers) into beats.json (absolute seconds),
using the real voice timings in caps_raw.json. The first beat always starts at 0.0 (frame 1 = hook).
  python -m timesketch.timing episodes/<slug>
"""
import json
import sys
from pathlib import Path


def resolve(episode: Path) -> dict:
    sb = json.loads((episode / "storyboard.json").read_text())
    caps = json.loads((episode / "caps_raw.json").read_text())
    total = round(caps[-1]["end"] + 2.0, 2)  # ~2s outro
    beats = []
    for i, b in enumerate(sb["beats"]):
        start = 0.0 if i == 0 else caps[b["phrase"]]["start"] + b.get("offset", 0.0)
        beats.append({**b, "start": round(start, 3)})
    for i, b in enumerate(beats):
        b["end"] = beats[i + 1]["start"] if i + 1 < len(beats) else total
    out = {"duration": total, "fps": 30, "loop": sb.get("loop", True), "cast": sb.get("cast", {}), "beats": beats}
    (episode / "beats.json").write_text(json.dumps(out, indent=2))
    lens = [round(b["end"] - b["start"], 2) for b in beats]
    print(f"[timing] {len(beats)} beats, {total}s, beat lengths {lens}")
    return out


if __name__ == "__main__":
    resolve(Path(sys.argv[1]))
