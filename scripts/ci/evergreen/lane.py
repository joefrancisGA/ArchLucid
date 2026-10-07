"""The kinds of red build Evergreen reacts to; each lane gets its own agent instructions."""

from __future__ import annotations

from enum import Enum


class Lane(str, Enum):
    # A push-corset / private-beta / OpenAPI / CI gate on trunk.
    TRUNK_GATE = "trunk_gate"
    # A scheduled (nightly / weekly) workflow on trunk.
    SCHEDULED = "scheduled"
    # The long-lived bugsmash branch, which already has an open PR.
    BUGSMASH = "bugsmash"
    # A Dependabot dependency-update branch, which already has an open PR.
    DEPENDABOT = "dependabot"


def parse_lanes(text: str) -> frozenset[Lane]:
    """Parse a comma-separated lane list (the EVERGREEN_DISABLED_LANES variable); blank means none."""
    names: list[str] = [part.strip().lower() for part in text.split(",") if part.strip()]
    valid: dict[str, Lane] = {lane.value: lane for lane in Lane}
    unknown: list[str] = [name for name in names if name not in valid]

    if unknown:
        raise ValueError(f"unknown lane(s) {unknown}; valid lanes: {sorted(valid)}")

    return frozenset(valid[name] for name in names)
