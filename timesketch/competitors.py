"""Competitor scout: find history/fact Shorts channels via the free YouTube Data API, collect each
channel's recent Shorts, and rank them with /yt-viral's swipe.py (multiple over own-channel median).

  YOUTUBE_API_KEY=... python3 -m timesketch.competitors                 # default niche queries
  YOUTUBE_API_KEY=... python3 -m timesketch.competitors --query "history facts shorts" --channels 15

Writes analytics/competitors/<date>/collected.json (swipe.py format) + channels.json, then runs swipe.py.
Quota: each search = 100 units, everything else 1 unit; the defaults use about 700 of the free 10,000/day.
Read-only, public data only.
"""
import argparse
import json
import os
import re
import subprocess
import sys
from datetime import date
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parent.parent
API = "https://www.googleapis.com/youtube/v3/"
DEFAULT_QUERIES = [
    "which came first history shorts", "history facts shorts animated", "history myths busted shorts",
    "did you know history shorts", "animated history explained shorts",
]
OWN = {"UCV-o4KXcSQjRcDwMH7l0OCA"}  # our channel(s): excluded from the competitor set


def call(endpoint: str, **params) -> dict:
    key = os.environ.get("YOUTUBE_API_KEY")
    if not key:
        sys.exit("YOUTUBE_API_KEY is not set (add it in the environment settings).")
    with urlopen(API + endpoint + "?" + urlencode({**params, "key": key}), timeout=30) as r:
        return json.load(r)


def iso_seconds(d: str) -> int:
    m = re.fullmatch(r"P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", d or "")
    if not m:
        return 0
    dd, h, mi, s = (int(x or 0) for x in m.groups())
    return dd * 86400 + h * 3600 + mi * 60 + s


def find_channels(queries, region, per_query) -> dict:
    chans = {}
    for q in queries:
        res = call("search", part="snippet", q=q, type="video", videoDuration="short",
                   order="viewCount", regionCode=region, relevanceLanguage="en", maxResults=per_query,
                   publishedAfter=f"{date.today().year - 1}-01-01T00:00:00Z")
        for it in res.get("items", []):
            cid = it["snippet"]["channelId"]
            if cid not in OWN:
                chans.setdefault(cid, {"title": it["snippet"]["channelTitle"], "found_by": q})
    return chans


def channel_shorts(cid: str, n: int) -> tuple[dict, list]:
    info = call("channels", part="snippet,statistics,contentDetails", id=cid)["items"][0]
    uploads = info["contentDetails"]["relatedPlaylists"]["uploads"]
    ids = [x["contentDetails"]["videoId"] for x in
           call("playlistItems", part="contentDetails", playlistId=uploads, maxResults=50).get("items", [])]
    vids = []
    for i in range(0, len(ids), 50):
        for v in call("videos", part="snippet,statistics,contentDetails", id=",".join(ids[i:i + 50])).get("items", []):
            dur = iso_seconds(v["contentDetails"]["duration"])
            if 0 < dur <= 180:  # Shorts can be up to 3 minutes
                vids.append({"channel": info["snippet"]["title"], "title": v["snippet"]["title"],
                             "views": int(v["statistics"].get("viewCount", 0)), "url": f"https://youtube.com/shorts/{v['id']}",
                             "duration": dur, "published": v["snippet"]["publishedAt"][:10]})
    meta = {"id": cid, "title": info["snippet"]["title"], "subs": int(info["statistics"].get("subscriberCount", 0) or 0),
            "videos": int(info["statistics"].get("videoCount", 0)), "country": info["snippet"].get("country")}
    return meta, vids[:n]


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--query", action="append", help="search query (repeatable); defaults to the niche set")
    ap.add_argument("--channels", type=int, default=20, help="max channels to analyse")
    ap.add_argument("--per-channel", type=int, default=30, help="recent Shorts per channel")
    ap.add_argument("--region", default="GB")
    ap.add_argument("--min", type=float, default=2.0, help="swipe.py outlier multiple threshold")
    a = ap.parse_args()

    out = ROOT / "analytics" / "competitors" / date.today().isoformat()
    out.mkdir(parents=True, exist_ok=True)
    chans = find_channels(a.query or DEFAULT_QUERIES, a.region, 15)
    print(f"[scout] {len(chans)} candidate channels")
    collected, metas = [], []
    for cid in list(chans)[: a.channels]:
        try:
            meta, vids = channel_shorts(cid, a.per_channel)
        except Exception as e:  # one bad channel shouldn't stop the run
            print(f"[scout] skip {chans[cid]['title']}: {e}")
            continue
        metas.append(meta)
        collected += vids
        print(f"[scout] {meta['title']}: {meta['subs']:,} subs, {len(vids)} Shorts")
    (out / "collected.json").write_text(json.dumps(collected, indent=2))
    (out / "channels.json").write_text(json.dumps(sorted(metas, key=lambda m: -m["subs"]), indent=2))
    print(f"[scout] saved {len(collected)} Shorts -> {out}")
    swipe = ROOT / ".claude" / "skills" / "yt-viral" / "swipe.py"
    report = subprocess.run([sys.executable, str(swipe), str(out / "collected.json"), "--min", str(a.min)],
                            capture_output=True, text=True)
    (out / "swipe.txt").write_text(report.stdout)
    print(report.stdout)


if __name__ == "__main__":
    main()
