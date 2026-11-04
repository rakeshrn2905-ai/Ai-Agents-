"""CLI: run the whole pipeline or any single agent.

  python -m youtube_agents run --niche "personal finance for students"
  python -m youtube_agents research --niche "home workouts"
  python -m youtube_agents script runs/<id>
  python -m youtube_agents build  runs/<id>
  python -m youtube_agents upload runs/<id> --privacy unlisted
"""
import argparse
import json
import re
from datetime import datetime
from pathlib import Path

from . import research_agent, script_agent, upload_agent, video_agent
from .config import RUNS_DIR
from .models import ResearchReport, VideoPackage


def _new_run_dir(niche: str) -> Path:
    slug = re.sub(r"[^a-z0-9]+", "-", niche.lower()).strip("-")[:40]
    d = RUNS_DIR / f"{datetime.now():%Y%m%d-%H%M%S}-{slug}"
    d.mkdir(parents=True, exist_ok=True)
    return d


def _save(path: Path, model):
    path.write_text(model.model_dump_json(indent=2))


def _meta(run: Path) -> dict:
    p = run / "meta.json"
    return json.loads(p.read_text()) if p.exists() else {}


def do_research(args) -> Path:
    run = _new_run_dir(args.niche)
    report, videos = research_agent.run(args.niche, args.days)
    _save(run / "research.json", report)
    (run / "trending.json").write_text(json.dumps([v.model_dump() for v in videos], indent=2))
    (run / "meta.json").write_text(json.dumps({"niche": args.niche, "format": args.format, "minutes": args.minutes}))
    print(f"\n=== Niche analysis: {report.niche} ===\n{report.summary}\n")
    for i, idea in enumerate(report.ideas):
        star = "*" if i == report.best_idea_index else " "
        print(f" {star}[{i}] ({idea.opportunity_score}/10) {idea.topic} - {idea.angle}")
    print(f"\nSaved to {run}")
    return run


def do_script(run: Path, idea_index: int | None = None):
    meta = _meta(run)
    report = ResearchReport.model_validate_json((run / "research.json").read_text())
    idea = report.ideas[idea_index] if idea_index is not None else None
    pkg = script_agent.run(report, idea, meta.get("format", "long"), meta.get("minutes", 5))
    _save(run / "package.json", pkg)
    print(f"\nTitle: {pkg.title}\nAlternatives: {' | '.join(pkg.alternative_titles)}")
    print(f"Thumbnail text: {pkg.thumbnail_text}\nSaved to {run / 'package.json'} (edit it freely before building)")


def do_build(run: Path):
    pkg = VideoPackage.model_validate_json((run / "package.json").read_text())
    video_agent.run(pkg, run, _meta(run).get("format", "long"))


def do_upload(run: Path, privacy: str, publish_at: str | None):
    pkg = VideoPackage.model_validate_json((run / "package.json").read_text())
    url = upload_agent.run(pkg, run / "video.mp4", run / "thumbnail.jpg", privacy, publish_at)
    (run / "upload.json").write_text(json.dumps({"url": url, "privacy": privacy, "publish_at": publish_at}))


def main():
    p = argparse.ArgumentParser(prog="youtube_agents", description="4-agent YouTube pipeline")
    sub = p.add_subparsers(dest="cmd", required=True)

    def research_opts(sp):
        sp.add_argument("--niche", required=True, help='e.g. "AI tools for small business"')
        sp.add_argument("--format", choices=["long", "shorts"], default="long")
        sp.add_argument("--minutes", type=float, default=5, help="target length for long videos")
        sp.add_argument("--days", type=int, default=30, help="look-back window for trends")

    def upload_opts(sp):
        sp.add_argument("--privacy", choices=["private", "unlisted", "public"], default="private")
        sp.add_argument("--publish-at", help="schedule, ISO 8601 UTC e.g. 2026-11-10T15:00:00Z")

    r = sub.add_parser("run", help="research -> script -> build -> (upload)")
    research_opts(r)
    upload_opts(r)
    r.add_argument("--idea", type=int, help="pick idea index instead of the recommended one")
    r.add_argument("--no-upload", action="store_true", help="stop after building the video")

    research_opts(sub.add_parser("research", help="Agent 1: find trends and ideas"))
    s = sub.add_parser("script", help="Agent 2: write script/title/description")
    s.add_argument("run_dir", type=Path)
    s.add_argument("--idea", type=int)
    sub.add_parser("build", help="Agent 3: make the video").add_argument("run_dir", type=Path)
    u = sub.add_parser("upload", help="Agent 4: upload to YouTube")
    u.add_argument("run_dir", type=Path)
    upload_opts(u)

    a = p.parse_args()
    if a.cmd == "research":
        do_research(a)
    elif a.cmd == "script":
        do_script(a.run_dir, a.idea)
    elif a.cmd == "build":
        do_build(a.run_dir)
    elif a.cmd == "upload":
        do_upload(a.run_dir, a.privacy, a.publish_at)
    else:
        run = do_research(a)
        do_script(run, a.idea)
        do_build(run)
        if a.no_upload:
            print(f"\nVideo ready for review: {run / 'video.mp4'}")
        else:
            do_upload(run, a.privacy, a.publish_at)


if __name__ == "__main__":
    main()
