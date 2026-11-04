"""Analyst: pull our own channel's per-video numbers from the free YouTube Analytics API and
update analytics/results.csv. Uses the same OAuth login as the publisher (client_secret.json ->
token.json, Time Sketch Brand Account) - run it on your own computer the first time so the
browser login works.

  python3 -m timesketch.analytics                 # last 90 days, every video
  python3 -m timesketch.analytics --days 28
  python3 -m timesketch.analytics --retention VIDEO_ID   # retention curve -> CSV for /yt-retention

"Stayed to watch" (viewed vs swiped away) is only in YouTube Studio, not the API. The API gives
averageViewPercentage, averageViewDuration, engagedViews and subscribersGained; enter
stayed-to-watch % by hand in results.csv from Studio (Analytics -> the Short -> Engagement).
"""
import argparse
import csv
import json
from datetime import date, timedelta
from pathlib import Path

from timesketch.publish import ROOT, credentials

RESULTS = ROOT / "analytics" / "results.csv"
FIELDS = ["episode", "video_id", "title", "publish_at", "length_s", "stayed_to_watch_pct", "views",
          "subs_gained", "notes", "engaged_views", "avg_view_pct", "avg_view_s", "likes", "shares", "updated"]


def services():
    from googleapiclient.discovery import build

    creds = credentials()
    return (build("youtubeAnalytics", "v2", credentials=creds, cache_discovery=False),
            build("youtube", "v3", credentials=creds, cache_discovery=False))


def per_video(ya, start: str, end: str) -> list[dict]:
    res = ya.reports().query(
        ids="channel==MINE", startDate=start, endDate=end, dimensions="video", sort="-views", maxResults=200,
        metrics="views,engagedViews,averageViewPercentage,averageViewDuration,subscribersGained,likes,shares",
    ).execute()
    cols = [h["name"] for h in res["columnHeaders"]]
    return [dict(zip(cols, r)) for r in res.get("rows", [])]


def retention(ya, vid: str, start: str, end: str) -> Path:
    res = ya.reports().query(ids="channel==MINE", startDate=start, endDate=end, dimensions="elapsedVideoTimeRatio",
                             metrics="audienceWatchRatio", filters=f"video=={vid}").execute()
    out = ROOT / "analytics" / f"retention_{vid}.csv"
    with out.open("w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["position_pct", "still_watching_pct"])
        for ratio, watch in res.get("rows", []):
            w.writerow([round(ratio * 100, 1), round(watch * 100, 1)])
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--days", type=int, default=90)
    ap.add_argument("--retention", metavar="VIDEO_ID")
    a = ap.parse_args()
    end = date.today().isoformat()
    start = (date.today() - timedelta(days=a.days)).isoformat()
    ya, yt = services()

    if a.retention:
        path = retention(ya, a.retention, start, end)
        print(f"[analyst] retention curve -> {path}\n  python3 .claude/skills/yt-retention/retention.py {path}")
        return

    rows = per_video(ya, start, end)
    titles = {}
    ids = [r["video"] for r in rows]
    for i in range(0, len(ids), 50):
        for v in yt.videos().list(part="snippet", id=",".join(ids[i:i + 50])).execute().get("items", []):
            titles[v["id"]] = (v["snippet"]["title"], v["snippet"]["publishedAt"][:10])

    existing = {}
    if RESULTS.exists():
        with RESULTS.open() as f:
            existing = {r["video_id"]: r for r in csv.DictReader(f) if r.get("video_id")}
    for r in rows:
        e = existing.setdefault(r["video"], {"episode": "", "video_id": r["video"]})
        t, pub = titles.get(r["video"], ("", ""))
        e.update({"title": e.get("title") or t, "publish_at": e.get("publish_at") or pub, "views": int(r["views"]),
                  "engaged_views": int(r["engagedViews"]), "avg_view_pct": round(r["averageViewPercentage"], 1),
                  "avg_view_s": round(r["averageViewDuration"], 1), "subs_gained": int(r["subscribersGained"]),
                  "likes": int(r["likes"]), "shares": int(r["shares"]), "updated": end})
    RESULTS.parent.mkdir(exist_ok=True)
    with RESULTS.open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=FIELDS, extrasaction="ignore")
        w.writeheader()
        for e in sorted(existing.values(), key=lambda x: x.get("publish_at") or "", reverse=True):
            w.writerow(e)
    print(f"[analyst] {len(rows)} videos ({start} -> {end}) -> {RESULTS}")
    print(f"{'views':>8} {'avg%':>6} {'subs':>5}  title")
    for r in rows[:20]:
        print(f"{int(r['views']):>8} {r['averageViewPercentage']:>6.1f} {int(r['subscribersGained']):>5}  {titles.get(r['video'], ('?',))[0]}")
    print(json.dumps({"next": "add stayed_to_watch_pct from Studio, then ask Claude for /yt-audit"}))


if __name__ == "__main__":
    main()
