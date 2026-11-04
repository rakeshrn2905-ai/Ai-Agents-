"""Agent 1 - Trend Researcher.

Scans YouTube (Data API v3) for what is performing in a niche right now, then asks
Claude to turn the raw numbers into a niche analysis and ranked video ideas.
"""
from datetime import datetime, timedelta, timezone

from .config import YOUTUBE_API_KEY, YT_LANGUAGE, YT_REGION
from .llm import ask_structured
from .models import ResearchReport, TrendingVideo

SYSTEM = """You are a YouTube growth strategist. You study real performance data and find
video ideas with high demand and beatable competition. Be specific and data-driven:
cite the numbers you were given. Never invent statistics."""


def _youtube():
    from googleapiclient.discovery import build

    return build("youtube", "v3", developerKey=YOUTUBE_API_KEY, cache_discovery=False)


def fetch_trending(niche: str, days: int = 30, max_results: int = 25) -> list[TrendingVideo]:
    """Top videos for `niche` published in the last `days` days, ranked by views/day."""
    yt = _youtube()
    since = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%dT%H:%M:%SZ")
    search = yt.search().list(
        q=niche,
        part="id",
        type="video",
        order="viewCount",
        publishedAfter=since,
        regionCode=YT_REGION,
        relevanceLanguage=YT_LANGUAGE,
        maxResults=max_results,
    ).execute()
    ids = [item["id"]["videoId"] for item in search.get("items", [])]
    if not ids:
        return []

    details = yt.videos().list(part="snippet,statistics", id=",".join(ids)).execute()
    now = datetime.now(timezone.utc)
    videos = []
    for v in details.get("items", []):
        s, st = v["snippet"], v.get("statistics", {})
        published = datetime.fromisoformat(s["publishedAt"].replace("Z", "+00:00"))
        age_days = max((now - published).total_seconds() / 86400, 0.5)
        views = int(st.get("viewCount", 0))
        videos.append(
            TrendingVideo(
                video_id=v["id"],
                title=s["title"],
                channel=s["channelTitle"],
                views=views,
                likes=int(st.get("likeCount", 0)),
                comments=int(st.get("commentCount", 0)),
                published_at=s["publishedAt"],
                views_per_day=round(views / age_days, 1),
                tags=s.get("tags", [])[:15],
            )
        )
    return sorted(videos, key=lambda x: x.views_per_day, reverse=True)


def run(niche: str, days: int = 30) -> tuple[ResearchReport, list[TrendingVideo]]:
    videos: list[TrendingVideo] = []
    if YOUTUBE_API_KEY:
        print(f"[Research] Scanning YouTube for '{niche}' (last {days} days)...")
        videos = fetch_trending(niche, days)
        print(f"[Research] Found {len(videos)} videos.")
    else:
        print("[Research] No YOUTUBE_API_KEY set - analysing from Claude's knowledge only.")

    if videos:
        table = "\n".join(
            f"- \"{v.title}\" | {v.channel} | {v.views:,} views | {v.views_per_day:,.0f}/day | "
            f"{v.likes:,} likes | {v.comments:,} comments | tags: {', '.join(v.tags[:8])}"
            for v in videos
        )
        data = f"Top videos in this niche from the last {days} days (sorted by views/day):\n{table}"
    else:
        data = "No live data available. Use your general knowledge of this niche and say so in the summary."

    prompt = f"""Niche: {niche}

{data}

Analyse the niche: what is working, which title formulas repeat, and which gaps are
under-served. Then propose 5 specific video ideas a new channel could win with, score
each 1-10 for opportunity, and pick the best one."""
    report = ask_structured(SYSTEM, prompt, ResearchReport)
    report.best_idea_index = min(max(report.best_idea_index, 0), len(report.ideas) - 1)
    return report, videos
