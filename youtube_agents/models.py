"""Data passed between the four agents."""
from pydantic import BaseModel, Field


class TrendingVideo(BaseModel):
    video_id: str
    title: str
    channel: str
    views: int
    likes: int
    comments: int
    published_at: str
    views_per_day: float
    tags: list[str] = []


class VideoIdea(BaseModel):
    topic: str
    angle: str = Field(description="What makes this take different from existing videos")
    target_audience: str
    why_it_will_work: str
    keywords: list[str]
    opportunity_score: int = Field(description="1-10: demand vs. competition")


class ResearchReport(BaseModel):
    niche: str
    summary: str = Field(description="What is working in this niche right now")
    title_patterns: list[str] = Field(description="Title formulas that top videos use")
    content_gaps: list[str] = Field(description="Questions/angles that are under-served")
    ideas: list[VideoIdea]
    best_idea_index: int = Field(description="Index into ideas of the recommended idea")


class ScriptSection(BaseModel):
    heading: str
    narration: str = Field(description="Exact words the voiceover will say")
    on_screen_text: str = Field(description="Short punchy text (max ~8 words) shown on screen")


class VideoPackage(BaseModel):
    title: str = Field(description="Catchy, curiosity-driven title, max 70 characters")
    alternative_titles: list[str]
    description: str = Field(description="SEO description with hook first 2 lines, summary, CTA, hashtags")
    tags: list[str] = Field(description="15-25 YouTube tags, total under 450 characters")
    hashtags: list[str]
    thumbnail_text: str = Field(description="2-4 word thumbnail text")
    hook: str = Field(description="First 5 seconds of narration that stops the scroll")
    sections: list[ScriptSection]
    call_to_action: str
    category_id: str = Field(description="YouTube category id, e.g. 27 Education, 22 People & Blogs, 28 Science & Tech")
