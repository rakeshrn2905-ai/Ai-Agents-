"""Shared Claude helper: structured (Pydantic-validated) output."""
from typing import Type, TypeVar

import anthropic
from pydantic import BaseModel

from .config import CLAUDE_MODEL

T = TypeVar("T", bound=BaseModel)

_client: anthropic.Anthropic | None = None


def client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        _client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY
    return _client


def ask_structured(system: str, prompt: str, schema: Type[T], effort: str = "high") -> T:
    """Ask Claude and get back a validated instance of `schema`."""
    response = client().beta.messages.parse(
        model=CLAUDE_MODEL,
        max_tokens=16000,
        system=system,
        thinking={"type": "adaptive"},
        output_config={"effort": effort},
        # If a request is declined by a safety classifier, the API retries it on a
        # fallback model automatically.
        betas=["server-side-fallback-2026-07-01"],
        fallbacks="default",
        messages=[{"role": "user", "content": prompt}],
        output_format=schema,
    )
    if response.stop_reason == "refusal":
        raise RuntimeError(f"Claude declined the request: {response.stop_details}")
    if response.stop_reason == "max_tokens":
        raise RuntimeError("Claude's response was cut off (max_tokens). Try a shorter video length.")
    if response.parsed_output is None:
        raise RuntimeError("Claude did not return valid structured output.")
    return response.parsed_output
