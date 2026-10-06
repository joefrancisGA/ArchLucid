"""Extract the few log lines that explain a failed job."""

from __future__ import annotations

import re
from typing import Iterable

# GitHub Actions prefixes each log line with an ISO timestamp; strip it so excerpts are stable.
_TIMESTAMP_PREFIX = re.compile(r"^\S*\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z\s?")
# ANSI colour codes from dotnet / npm / gitleaks output.
_ANSI_ESCAPE = re.compile(r"\x1b\[[0-9;]*[A-Za-z]")
# Lines worth surfacing: GitHub annotations, compiler errors, test failures, gitleaks findings
# (gitleaks reports the location on separate ``Finding:`` / ``File:`` / ``Line:`` lines).
# Case-sensitive on purpose: lower-case ``failed`` appears in echoed shell scripts and prose.
_ERROR_LINE = re.compile(
    r"(##\[(error|warning)\]|\berror\s+[A-Z]{2,}\d{3,}\b|\bFAIL(ED)?\b|\bFailed\b|leaks found"
    r"|^(Finding|File|Line|RuleID):|npm ERR!|(?<![\w-])Error:|Exception)"
)


class ErrorExcerptExtractor:
    """Pick out error-bearing lines from raw job log text.

    The result is bounded in both line count and line length so the prompt sent
    to the agent stays small and cannot be flooded by a chatty log.
    """

    def __init__(self, max_lines: int = 40, max_line_length: int = 400) -> None:
        if max_lines <= 0 or max_line_length <= 0:
            raise ValueError("max_lines and max_line_length must be positive")

        self._max_lines = max_lines
        self._max_line_length = max_line_length

    def extract(self, log_text: str) -> list[str]:
        cleaned_lines: Iterable[str] = (self._clean(line) for line in log_text.splitlines())
        error_lines: list[str] = [line for line in cleaned_lines if line and _ERROR_LINE.search(line)]
        unique_lines: list[str] = list(dict.fromkeys(error_lines))
        return unique_lines[: self._max_lines]

    def _clean(self, line: str) -> str:
        without_timestamp: str = _TIMESTAMP_PREFIX.sub("", line, count=1)
        without_ansi: str = _ANSI_ESCAPE.sub("", without_timestamp).strip()
        return without_ansi[: self._max_line_length]
