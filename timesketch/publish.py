"""Publisher agent: upload an episode's final.mp4 to YouTube and schedule it.

  python -m timesketch.publish episodes/<slug> --dry-run     # check everything, upload nothing
  python -m timesketch.publish episodes/<slug>               # upload + schedule next free slot
  python -m timesketch.publish episodes/<slug> --slot 2026-11-06T17:00
  python -m timesketch.publish episodes/<slug> --now         # public immediately
  python -m timesketch.publish episodes/<slug> --private     # upload only, publish by hand

Reads episodes/<slug>/package.json (written with /yt-package + /yt-seo):
  {"title": "...", "description": "...", "tags": ["..."], "thumb_time": 0.6}
Schedule: 07:00 and 17:00 Europe/London. Category Education (27), not made for kids,
no altered/synthetic disclosure (clearly cartoon). Booked slots live in analytics/schedule.json.
Auth: OAuth "Desktop app" client in client_secret.json; first run opens a browser - pick the
Time Sketch Brand Account. Token saved to token.json.
"""
import argparse
import json
import os
import shutil
import subprocess
import sys
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parent.parent
LONDON = ZoneInfo("Europe/London")
SLOTS = [(7, 0), (17, 0)]
SCHEDULE = ROOT / "analytics" / "schedule.json"
RESULTS = ROOT / "analytics" / "results.csv"
CLIENT_SECRETS = ROOT / "client_secret.json"
TOKEN = ROOT / "token.json"
SCOPES = ["https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube",
          "https://www.googleapis.com/auth/yt-analytics.readonly"]  # analytics.py shares this login
CATEGORY_EDUCATION = "27"
MIN_LEAD = timedelta(minutes=30)
UPLOAD_EARLY = timedelta(minutes=30)  # job becomes due 30 min early so a Make run at the slot time always catches it  # don't book a slot that starts within 30 min


# ---------- checks ----------
def probe(video: Path) -> dict:
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                          "stream=width,height,r_frame_rate:format=duration", "-of", "json", str(video)],
                         capture_output=True, text=True, check=True)
    j = json.loads(out.stdout)
    s = j["streams"][0]
    num, den = map(int, s["r_frame_rate"].split("/"))
    return {"w": s["width"], "h": s["height"], "fps": num / den, "dur": float(j["format"]["duration"])}


def preflight(ep: Path, pkg: dict) -> list[str]:
    """Hard checks before anything goes to YouTube. Returns a list of problems (empty = OK)."""
    errs = []
    video = ep / "final.mp4"
    if not video.exists():
        return [f"{video} missing - build the episode first"]
    dec = subprocess.run(["ffmpeg", "-v", "error", "-i", str(video), "-f", "null", "-"], capture_output=True, text=True)
    if dec.returncode or dec.stderr.strip():
        errs.append(f"full decode failed: {dec.stderr.strip()[:200]}")
    p = probe(video)
    if (p["w"], p["h"]) != (1080, 1920):
        errs.append(f"resolution {p['w']}x{p['h']}, need 1080x1920")
    if abs(p["fps"] - 30) > 0.01:
        errs.append(f"{p['fps']:.2f} fps, need 30")
    if not 20 <= p["dur"] <= 30.5:
        errs.append(f"duration {p['dur']:.1f}s, rule is 20-30s")
    t = pkg.get("title", "")
    if not t:
        errs.append("package.json has no title")
    if len(t) > 100:
        errs.append(f"title is {len(t)} chars (YouTube max 100)")
    if any(ch in t + pkg.get("description", "") for ch in "<>"):
        errs.append("title/description contain < or > (YouTube rejects them)")
    if len(pkg.get("description", "")) > 5000:
        errs.append("description over 5000 chars")
    if sum(len(x) + 1 for x in pkg.get("tags", [])) > 500:
        errs.append("tags over 500 chars total")
    facts = ep / "facts.json"
    if facts.exists():
        bad = [c["claim"] for c in json.loads(facts.read_text())["claims"]
               if c.get("status") != "verified" or len(c.get("sources", [])) < 2]
        if bad:
            errs.append(f"unverified claims in facts.json (rule 3): {bad}")
    else:
        errs.append("no facts.json - every episode needs checked facts (rule 3)")
    qa = ep / "qa.json"
    if qa.exists() and not json.loads(qa.read_text()).get("pass", False):
        errs.append("qa.json says FAIL")
    return errs


def lint_title(pkg: dict):
    """Show the /yt-package title.py verdict (informational)."""
    tool = ROOT / ".claude" / "skills" / "yt-package" / "title.py"
    if tool.exists():
        args = [sys.executable, str(tool), "--title", pkg["title"]]
        if pkg.get("thumbnail_text"):
            args += ["--thumb", pkg["thumbnail_text"]]
        subprocess.run(args)


# ---------- scheduling ----------
def booked() -> dict:
    return json.loads(SCHEDULE.read_text()) if SCHEDULE.exists() else {}


def next_slot(after: datetime | None = None) -> datetime:
    now = (after or datetime.now(LONDON)) + MIN_LEAD
    taken = set(booked().keys())
    day = now.date()
    for _ in range(60):
        for h, m in SLOTS:
            t = datetime(day.year, day.month, day.day, h, m, tzinfo=LONDON)  # zoneinfo handles BST/GMT
            if t > now and t.isoformat() not in taken:
                return t
        day += timedelta(days=1)
    raise RuntimeError("no free slot in the next 60 days")


def parse_slot(s: str) -> datetime:
    t = datetime.fromisoformat(s)
    t = t.replace(tzinfo=LONDON) if t.tzinfo is None else t.astimezone(LONDON)
    if (t.hour, t.minute) not in SLOTS:
        print(f"[publish] note: {t:%H:%M} is not one of the 07:00/17:00 slots")
    return t


# ---------- YouTube ----------
def credentials():
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow

    creds = Credentials.from_authorized_user_file(str(TOKEN), SCOPES) if TOKEN.exists() else None
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
    if not creds or not creds.valid:
        if not CLIENT_SECRETS.exists():
            sys.exit(f"[publish] {CLIENT_SECRETS.name} not found - see README 'Upload setup'.")
        creds = InstalledAppFlow.from_client_secrets_file(str(CLIENT_SECRETS), SCOPES).run_local_server(port=0)
        TOKEN.write_text(creds.to_json())
    return creds


def make_thumbnail(ep: Path, at: float) -> Path:
    thumb = ep / "thumbnail.jpg"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", str(at), "-i", str(ep / "final.mp4"),
                    "-frames:v", "1", "-q:v", "3", str(thumb)], check=True)
    return thumb


def upload(ep: Path, pkg: dict, mode: str, slot: datetime | None) -> str:
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload

    yt = build("youtube", "v3", credentials=credentials(), cache_discovery=False)
    status = {"selfDeclaredMadeForKids": False, "containsSyntheticMedia": False, "embeddable": True,
              "privacyStatus": {"now": "public", "private": "private", "schedule": "private"}[mode]}
    if mode == "schedule":
        status["publishAt"] = slot.astimezone(ZoneInfo("UTC")).strftime("%Y-%m-%dT%H:%M:%SZ")
    body = {
        "snippet": {"title": pkg["title"], "description": pkg.get("description", ""), "tags": pkg.get("tags", []),
                    "categoryId": CATEGORY_EDUCATION, "defaultLanguage": "en", "defaultAudioLanguage": "en"},
        "status": status,
    }
    req = yt.videos().insert(part="snippet,status", body=body, notifySubscribers=True,
                             media_body=MediaFileUpload(str(ep / "final.mp4"), mimetype="video/mp4", resumable=True, chunksize=8 << 20))
    resp = None
    while resp is None:
        prog, resp = req.next_chunk()
        if prog:
            print(f"[publish] uploading {int(prog.progress() * 100)}%")
    vid = resp["id"]
    try:
        thumb = make_thumbnail(ep, pkg.get("thumb_time", 0.6))
        yt.thumbnails().set(videoId=vid, media_body=MediaFileUpload(str(thumb), mimetype="image/jpeg")).execute()
    except Exception as e:  # needs a phone-verified channel; Shorts feed may ignore it anyway
        print(f"[publish] thumbnail not set: {e}")
    got = resp.get("status", {}).get("privacyStatus")
    if mode != "private" and got == "private" and "publishAt" not in resp.get("status", {}):
        print("[publish] WARNING: YouTube locked this upload to private. Unaudited API projects can only "
              "upload private videos - request the YouTube API audit, or publish it by hand in Studio.")
    return vid


def record(ep: Path, pkg: dict, vid: str, mode: str, slot: datetime | None):
    when = slot.isoformat() if slot else datetime.now(LONDON).isoformat(timespec="minutes")
    sched = booked()
    if mode == "schedule":
        sched[slot.isoformat()] = {"episode": ep.name, "video_id": vid, "title": pkg["title"]}
        SCHEDULE.parent.mkdir(exist_ok=True)
        SCHEDULE.write_text(json.dumps(dict(sorted(sched.items())), indent=2))
    (ep / "upload.json").write_text(json.dumps({"video_id": vid, "url": f"https://youtube.com/shorts/{vid}",
                                                "mode": mode, "publish_at": when}, indent=2))
    new = not RESULTS.exists()
    with RESULTS.open("a") as f:
        if new:
            f.write("episode,video_id,title,publish_at,length_s,stayed_to_watch_pct,views,subs_gained,notes\n")
        length = probe(ep / "final.mp4")["dur"]
        title = pkg["title"].replace('"', "'")
        f.write(f'{ep.name},{vid},"{title}",{when},{length:.1f},,,,\n')


def manual_pack(ep: Path, pkg: dict, slot: datetime) -> Path:
    """No Google Cloud: write a copy-paste upload pack for YouTube Studio and book the slot."""
    thumb = make_thumbnail(ep, pkg.get("thumb_time", 0.6))
    tags = ", ".join(pkg.get("tags", []))
    text = f"""# Upload pack - {ep.name}

Open studio.youtube.com (Time Sketch channel) -> Create -> Upload videos -> pick:
  {ep / 'final.mp4'}

## Title
{pkg['title']}

## Description
{pkg.get('description', '')}

## Tags (Show more -> Tags)
{tags}

## Settings
- Thumbnail: {thumb.name} (Shorts may ignore custom thumbnails)
- Audience: No, it's not made for kids
- Altered or synthetic content: No (clearly cartoon)
- Category (Show more): Education
- Visibility: Schedule -> {slot:%d %b %Y}, {slot:%H:%M}, time zone United Kingdom (London)

After publishing, paste the Short's link here so analytics can track it:
  python3 -m timesketch.publish {ep.relative_to(ROOT) if ep.is_relative_to(ROOT) else ep} --link https://youtube.com/shorts/VIDEO_ID
"""
    out = ep / "upload_pack.md"
    out.write_text(text)
    book(ep, pkg, slot, "manual")
    return out


def outbox() -> Path:
    """The Make.com outbox: a folder synced by Google Drive for desktop (or Dropbox)."""
    p = os.environ.get("MAKE_OUTBOX")
    if not p:
        sys.exit("[publish] set MAKE_OUTBOX to your synced outbox folder, e.g.\n"
                 '  export MAKE_OUTBOX="$HOME/Google Drive/My Drive/TimeSketch/outbox"   (see docs/MAKE.md)')
    path = Path(p).expanduser()
    (path / "done").mkdir(parents=True, exist_ok=True)
    return path


def book(ep: Path, pkg: dict, slot: datetime, via: str):
    sched = booked()
    sched[slot.isoformat()] = {"episode": ep.name, "video_id": None, "title": pkg["title"], "via": via}
    SCHEDULE.parent.mkdir(exist_ok=True)
    SCHEDULE.write_text(json.dumps(dict(sorted(sched.items())), indent=2))


def fit_for_make(src: Path, dst: Path):
    """Copy the master untouched. Make's free plan caps files at 5 MB; shrinking costs quality, so it only
    happens if the user opts in with MAKE_SHRINK=1. Otherwise: raise MAKE_MAX_MB after upgrading the Make
    plan, or use the Chrome route (uploads the original)."""
    limit_mb = float(os.environ.get("MAKE_MAX_MB", "4.8"))
    size_mb = src.stat().st_size / 1048576
    if size_mb <= limit_mb:
        shutil.copyfile(src, dst)
        return
    if os.environ.get("MAKE_SHRINK") != "1":
        sys.exit(f"[publish] final.mp4 is {size_mb:.1f} MB, over the Make file limit ({limit_mb} MB).\n"
                 "  Not shrinking it (that lowers quality). Options: use the Chrome route (original file),\n"
                 "  upgrade the Make plan and set MAKE_MAX_MB, or set MAKE_SHRINK=1 to accept a smaller copy.")
    for crf in (20, 23, 26):
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(src), "-c:v", "libx264", "-preset", "slow",
                        "-tune", "animation", "-crf", str(crf), "-pix_fmt", "yuv420p", "-colorspace", "bt709",
                        "-color_primaries", "bt709", "-color_trc", "bt709", "-c:a", "copy",
                        "-movflags", "+faststart", str(dst)], check=True)
        if dst.stat().st_size / 1048576 <= limit_mb:
            print(f"[publish] MAKE_SHRINK=1: smaller copy for Make, {dst.stat().st_size / 1048576:.1f} MB (crf {crf})")
            return
    sys.exit(f"[publish] could not get under {limit_mb} MB")


def make_job(ep: Path, pkg: dict, slot: datetime) -> Path:
    """Drop final.mp4 + a flat job file in the outbox; the Make scenario uploads it when it is due."""
    box = outbox()
    slug = ep.name
    fit_for_make(ep / "final.mp4", box / f"{slug}.mp4")
    utc = ZoneInfo("UTC")
    job = {
        "slug": slug, "video_file": f"{slug}.mp4",
        "title": pkg["title"], "description": pkg.get("description", ""),
        "tags_csv": ",".join(pkg.get("tags", [])), "category_id": CATEGORY_EDUCATION,
        "made_for_kids": False, "privacy": "public",
        "publish_at_utc": slot.astimezone(utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "upload_after_utc": (slot - UPLOAD_EARLY).astimezone(utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "publish_at_uk": slot.strftime("%a %d %b %Y %H:%M"),
    }
    # write the JSON last, so Make never sees a job whose video is still copying
    tmp = box / f".{slug}.json.tmp"
    tmp.write_text(json.dumps(job, indent=2))
    tmp.replace(box / f"{slug}.json")
    book(ep, pkg, slot, "make")
    return box / f"{slug}.json"


def sync_make():
    """Read Make's receipts (done/<slug>.txt containing the new video ID) and record them."""
    box = outbox()
    n = 0
    for rec in sorted((box / "done").glob("*.txt")):
        slug, vid = rec.stem, rec.read_text().strip().split()[0]
        ep = ROOT / "episodes" / slug
        if not (ep / "package.json").exists():
            print(f"[publish] receipt {rec.name}: no episodes/{slug} here, skipped")
            continue
        if (ep / "upload.json").exists():
            continue
        link(ep, json.loads((ep / "package.json").read_text()), vid, via="make")
        n += 1
    pending = [j.stem for j in box.glob("*.json")]
    print(f"[publish] synced {n} new upload(s); still waiting in outbox: {', '.join(pending) or 'none'}")


def link(ep: Path, pkg: dict, url: str, via: str = "manual"):
    """Record a manually uploaded video's ID so analytics can find it."""
    vid = url.rstrip("/").split("/")[-1].split("v=")[-1].split("?")[0]
    sched = booked()
    slot = next((datetime.fromisoformat(k) for k, v in sched.items() if v.get("episode") == ep.name), None)
    if slot:
        sched[slot.isoformat()]["video_id"] = vid
        SCHEDULE.write_text(json.dumps(dict(sorted(sched.items())), indent=2))
    record(ep, pkg, vid, via, None if slot is None else slot)
    print(f"[publish] linked {ep.name} -> https://youtube.com/shorts/{vid}")


def main():
    ap = argparse.ArgumentParser(prog="timesketch.publish", description="Upload + schedule a Time Sketch Short")
    ap.add_argument("episode", type=Path, nargs="?")
    g = ap.add_mutually_exclusive_group()
    g.add_argument("--now", action="store_true", help="publish publicly right away")
    g.add_argument("--private", action="store_true", help="upload as private, don't schedule")
    g.add_argument("--slot", help="schedule for this UK time, e.g. 2026-11-06T17:00")
    ap.add_argument("--make", action="store_true", help="queue for the Make.com scenario (MAKE_OUTBOX folder)")
    ap.add_argument("--sync", action="store_true", help="read Make.com upload receipts into the results log")
    ap.add_argument("--manual", action="store_true", help="no automation: write upload_pack.md for YouTube Studio")
    ap.add_argument("--link", metavar="URL", help="after a manual upload: record the Short's URL")
    ap.add_argument("--dry-run", action="store_true", help="run every check, upload nothing")
    ap.add_argument("--force", action="store_true", help="upload even if a preflight check fails")
    a = ap.parse_args()
    if a.sync:
        return sync_make()
    if not a.episode:
        ap.error("episode folder required")
    ep = a.episode.resolve()
    pkg_path = ep / "package.json"
    if not pkg_path.exists():
        sys.exit(f"[publish] {pkg_path} missing - write it with /yt-package + /yt-seo first.")
    pkg = json.loads(pkg_path.read_text())
    if (ep / "upload.json").exists() and not a.force:
        sys.exit(f"[publish] already uploaded: {json.loads((ep / 'upload.json').read_text())['url']} (use --force to re-upload)")

    if a.link:
        return link(ep, pkg, a.link)
    mode = "now" if a.now else "private" if a.private else "schedule"
    slot = parse_slot(a.slot) if a.slot else (next_slot() if mode == "schedule" else None)
    if slot and slot.isoformat() in booked() and booked()[slot.isoformat()].get("episode") != ep.name:
        sys.exit(f"[publish] slot {slot:%a %d %b %H:%M} is already booked by {booked()[slot.isoformat()]['episode']}")

    errs = preflight(ep, pkg)
    lint_title(pkg)
    for e in errs:
        print(f"[publish] FAIL: {e}")
    if errs and not a.force:
        sys.exit("[publish] not uploading - fix the problems above (or --force).")

    when = f"scheduled for {slot:%a %d %b %Y %H:%M} UK" if slot else ("public now" if mode == "now" else "private")
    print(f"[publish] '{pkg['title']}' -> {when} | Education | not made for kids")
    if a.manual or a.make:
        mine = [k for k, v in booked().items() if v.get("episode") == ep.name]
        if mine and not a.slot:  # re-running keeps the slot already booked for this episode
            slot = datetime.fromisoformat(mine[0])
        if mode != "schedule":
            sys.exit("[publish] --manual/--make only work with scheduling (default or --slot)")
        if a.dry_run:
            print("[publish] dry run - nothing queued."); return
        if a.make:
            print(f"[publish] queued for Make -> {make_job(ep, pkg, slot)} (Make uploads it at its {slot:%H:%M} UK run)")
        else:
            print(f"[publish] upload pack -> {manual_pack(ep, pkg, slot)}")
        return
    if a.dry_run:
        print("[publish] dry run - nothing uploaded.")
        return
    vid = upload(ep, pkg, mode, slot)
    record(ep, pkg, vid, mode, slot)
    print(f"[publish] done: https://youtube.com/shorts/{vid}")


if __name__ == "__main__":
    main()
