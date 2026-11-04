"""Agent 4 - YouTube Uploader.

Uploads the MP4 with title/description/tags, sets the thumbnail, and optionally
schedules publishing. Uses OAuth (first run opens a browser to authorise your channel).
Uploads are PRIVATE by default so you can review before going public.
"""
from pathlib import Path

from .config import YOUTUBE_CLIENT_SECRETS, YOUTUBE_TOKEN_FILE
from .models import VideoPackage

SCOPES = ["https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube"]


def _credentials():
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow

    creds = None
    if Path(YOUTUBE_TOKEN_FILE).exists():
        creds = Credentials.from_authorized_user_file(YOUTUBE_TOKEN_FILE, SCOPES)
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
    if not creds or not creds.valid:
        if not Path(YOUTUBE_CLIENT_SECRETS).exists():
            raise RuntimeError(
                f"OAuth client file '{YOUTUBE_CLIENT_SECRETS}' not found. See README: 'Upload setup'."
            )
        flow = InstalledAppFlow.from_client_secrets_file(YOUTUBE_CLIENT_SECRETS, SCOPES)
        creds = flow.run_local_server(port=0)
        Path(YOUTUBE_TOKEN_FILE).write_text(creds.to_json())
    return creds


def _fit_tags(tags: list[str], limit: int = 450) -> list[str]:
    out, total = [], 0
    for t in tags:
        t = t.replace("<", "").replace(">", "").strip()
        if t and total + len(t) + 1 <= limit:
            out.append(t)
            total += len(t) + 1
    return out


def run(package: VideoPackage, video: Path, thumbnail: Path | None = None,
        privacy: str = "private", publish_at: str | None = None, made_for_kids: bool = False) -> str:
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload

    yt = build("youtube", "v3", credentials=_credentials(), cache_discovery=False)
    status = {"privacyStatus": privacy, "selfDeclaredMadeForKids": made_for_kids}
    if publish_at:  # ISO 8601, e.g. 2026-11-10T15:00:00Z; YouTube requires private + publishAt
        status.update(privacyStatus="private", publishAt=publish_at)

    body = {
        "snippet": {
            "title": package.title[:100],
            "description": package.description[:5000],
            "tags": _fit_tags(package.tags),
            "categoryId": package.category_id or "22",
        },
        "status": status,
    }
    print(f"[Upload] Uploading '{package.title}' ({status['privacyStatus']})...")
    request = yt.videos().insert(
        part="snippet,status", body=body,
        media_body=MediaFileUpload(str(video), chunksize=8 * 1024 * 1024, resumable=True, mimetype="video/mp4"),
    )
    response = None
    while response is None:
        progress, response = request.next_chunk()
        if progress:
            print(f"[Upload] {int(progress.progress() * 100)}%")
    video_id = response["id"]

    if thumbnail and thumbnail.exists():
        try:
            yt.thumbnails().set(videoId=video_id, media_body=MediaFileUpload(str(thumbnail))).execute()
        except Exception as e:  # custom thumbnails need a verified channel
            print(f"[Upload] Thumbnail not set ({e}). Verify your channel at youtube.com/verify.")

    url = f"https://youtu.be/{video_id}"
    print(f"[Upload] Live at {url}")
    return url
