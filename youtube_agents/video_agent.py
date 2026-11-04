"""Agent 3 - Video Builder.

Builds a ready-to-upload MP4 from the script:
  1. Voiceover for every section (Google TTS via gTTS).
  2. A designed slide per section (Pillow) showing the on-screen text.
  3. Each slide + its audio rendered to a clip, then all clips joined (ffmpeg).
  4. A 1280x720 thumbnail.
Requires `ffmpeg` on PATH.
"""
import shutil
import subprocess
import textwrap
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

from .config import YT_LANGUAGE
from .models import VideoPackage

SIZES = {"long": (1920, 1080), "shorts": (1080, 1920)}
PALETTES = [
    ((17, 24, 39), (79, 70, 229)),
    ((15, 23, 42), (14, 165, 233)),
    ((24, 24, 27), (225, 29, 72)),
    ((20, 20, 20), (234, 179, 8)),
    ((6, 78, 59), (16, 185, 129)),
]
FONT_CANDIDATES = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/Library/Fonts/Arial Bold.ttf",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "C:/Windows/Fonts/arialbd.ttf",
]


def _font(size: int) -> ImageFont.FreeTypeFont:
    for path in FONT_CANDIDATES:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default(size=size)


def _gradient(size, top, bottom) -> Image.Image:
    w, h = size
    img = Image.new("RGB", size, top)
    draw = ImageDraw.Draw(img)
    for y in range(h):
        t = y / h
        draw.line([(0, y), (w, y)], fill=tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3)))
    return img


def _draw_centered(draw, text, font, box_w, y_center, width_chars, fill="white", stroke=0):
    lines = textwrap.wrap(text, width=width_chars) or [""]
    line_h = font.size * 1.2
    y = y_center - line_h * len(lines) / 2
    for line in lines:
        w = draw.textlength(line, font=font)
        draw.text(((box_w - w) / 2, y), line, font=font, fill=fill, stroke_width=stroke, stroke_fill="black")
        y += line_h


def make_slide(path: Path, heading: str, text: str, size, palette, index: int, total: int):
    w, h = size
    img = _gradient(size, *palette)
    draw = ImageDraw.Draw(img)
    vertical = h > w
    big = _font(int(w * (0.09 if vertical else 0.06)))
    small = _font(int(w * (0.04 if vertical else 0.025)))
    _draw_centered(draw, heading.upper(), small, w, h * 0.15, 28 if vertical else 50, fill=(200, 200, 210))
    _draw_centered(draw, text, big, w, h * 0.5, 14 if vertical else 26, stroke=3)
    # progress bar
    bar_y = h - int(h * 0.02)
    draw.rectangle([0, bar_y, w, h], fill=(40, 40, 40))
    draw.rectangle([0, bar_y, int(w * (index + 1) / total), h], fill=(255, 255, 255))
    img.save(path)


def make_thumbnail(path: Path, text: str):
    size = (1280, 720)
    img = _gradient(size, (10, 10, 10), (220, 38, 38))
    draw = ImageDraw.Draw(img)
    _draw_centered(draw, text.upper(), _font(130), size[0], size[1] / 2, 12, fill=(255, 235, 59), stroke=8)
    img.convert("RGB").save(path, quality=92)


def tts(text: str, out: Path):
    """Voiceover: Google TTS, falling back to espeak-ng, then to silence (for previews)."""
    try:
        from gtts import gTTS

        gTTS(text=text, lang=YT_LANGUAGE).save(str(out))
        return
    except Exception as e:
        print(f"[Video] Google TTS failed ({type(e).__name__}); trying fallback.")
    espeak = shutil.which("espeak-ng") or shutil.which("espeak")
    if espeak:
        wav = out.with_suffix(".wav")
        subprocess.run([espeak, "-v", YT_LANGUAGE, "-s", "165", "-w", str(wav), text], check=True)
        _ffmpeg("-i", str(wav), str(out))
        return
    seconds = max(2.0, len(text.split()) / 2.5)
    print(f"[Video] WARNING: no TTS available - using {seconds:.0f}s of silence for this segment.")
    _ffmpeg("-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo", "-t", f"{seconds:.2f}", str(out))


def _ffmpeg(*args):
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *args], check=True)


def render_clip(image: Path, audio: Path, out: Path, size):
    w, h = size
    _ffmpeg(
        "-loop", "1", "-i", str(image), "-i", str(audio),
        "-c:v", "libx264", "-tune", "stillimage", "-pix_fmt", "yuv420p", "-r", "30",
        "-vf", f"scale={w}:{h},fade=t=in:st=0:d=0.3",
        "-c:a", "aac", "-b:a", "192k", "-ar", "44100", "-ac", "2",
        "-shortest", str(out),
    )


def run(package: VideoPackage, out_dir: Path, fmt: str = "long") -> tuple[Path, Path]:
    if not shutil.which("ffmpeg"):
        raise RuntimeError("ffmpeg is not installed or not on PATH.")
    size = SIZES[fmt]
    work = out_dir / "build"
    work.mkdir(parents=True, exist_ok=True)

    segments = [("Hook", package.hook, package.thumbnail_text)]
    segments += [(s.heading, s.narration, s.on_screen_text) for s in package.sections]
    segments.append(("Before you go", package.call_to_action, "Subscribe for more"))

    clips = []
    for i, (heading, narration, screen_text) in enumerate(segments):
        print(f"[Video] Segment {i + 1}/{len(segments)}: {heading}")
        img, mp3, mp4 = work / f"{i:02d}.png", work / f"{i:02d}.mp3", work / f"{i:02d}.mp4"
        make_slide(img, heading, screen_text, size, PALETTES[i % len(PALETTES)], i, len(segments))
        tts(narration, mp3)
        render_clip(img, mp3, mp4, size)
        clips.append(mp4)

    concat = work / "concat.txt"
    concat.write_text("".join(f"file '{c.resolve()}'\n" for c in clips))
    video = out_dir / "video.mp4"
    _ffmpeg("-f", "concat", "-safe", "0", "-i", str(concat), "-c", "copy", "-movflags", "+faststart", str(video))

    thumb = out_dir / "thumbnail.jpg"
    make_thumbnail(thumb, package.thumbnail_text)
    print(f"[Video] Done: {video}")
    return video, thumb
