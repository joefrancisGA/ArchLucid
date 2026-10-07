"""The few pull request fields the dedupe gate reads."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any

# Title prefix the Evergreen SOP requires when an agent hits a hard limit and hands the problem to the owner.
ESCALATION_TITLE_PREFIX = "NEEDS OWNER"


@dataclass(frozen=True)
class PullRequestRecord:
    number: int
    title: str
    body: str
    state: str
    merged_at: datetime | None
    closed_at: datetime | None

    @property
    def is_open(self) -> bool:
        return self.state == "open"

    @property
    def is_escalation(self) -> bool:
        return self.title.strip().upper().startswith(ESCALATION_TITLE_PREFIX)

    @property
    def settled_at(self) -> datetime | None:
        """When the PR stopped being open, or ``None`` while it is still open."""
        return self.merged_at or self.closed_at

    @staticmethod
    def from_api(payload: dict[str, Any]) -> "PullRequestRecord":
        return PullRequestRecord(
            number=int(payload["number"]),
            title=str(payload.get("title") or ""),
            body=str(payload.get("body") or ""),
            state=str(payload.get("state") or ""),
            merged_at=PullRequestRecord._parse_time(payload.get("merged_at")),
            closed_at=PullRequestRecord._parse_time(payload.get("closed_at")),
        )

    @staticmethod
    def _parse_time(value: object) -> datetime | None:
        if not value:
            return None

        # The API emits a trailing "Z"; normalise so the result is timezone-aware on every Python version.
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
