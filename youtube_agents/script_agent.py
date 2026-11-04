"""Agent 2 - Script Writer.

Turns the chosen idea into a full video package: hook, narrated script sections,
catchy title (+ alternatives), SEO description, tags, hashtags and thumbnail text.
"""
from .llm import ask_structured
from .models import ResearchReport, VideoIdea, VideoPackage

SYSTEM = """You are an elite YouTube scriptwriter and packaging expert.
- Titles: curiosity + clear payoff, under 70 characters, no clickbait that the video doesn't deliver.
- Hook: the first sentence must create an open loop or bold claim within 5 seconds.
- Script: conversational, short sentences, one idea per section, pattern interrupts,
  re-hooks every ~30 seconds, and a payoff that pays the hook.
- Description: first 2 lines are a hook for search, then a summary, then a CTA, then hashtags.
- Tags: mix broad and long-tail keywords.
Write narration exactly as it should be spoken (no stage directions)."""


def run(report: ResearchReport, idea: VideoIdea | None = None, fmt: str = "long", minutes: float = 5.0) -> VideoPackage:
    idea = idea or report.ideas[report.best_idea_index]
    if fmt == "shorts":
        length = "a YouTube Short under 55 seconds (about 120-140 spoken words, 4-6 sections)"
    else:
        words = int(minutes * 150)
        length = f"a ~{minutes:g}-minute video (about {words} spoken words, 6-10 sections)"

    print(f"[Script] Writing {length} on: {idea.topic}")
    prompt = f"""Niche: {report.niche}
Niche insights: {report.summary}
Title patterns that work here: {'; '.join(report.title_patterns)}
Content gaps: {'; '.join(report.content_gaps)}

Video idea: {idea.topic}
Angle: {idea.angle}
Audience: {idea.target_audience}
Keywords: {', '.join(idea.keywords)}

Write the complete package for {length}. The hook is spoken first, then the sections,
then the call to action."""
    return ask_structured(SYSTEM, prompt, VideoPackage)
