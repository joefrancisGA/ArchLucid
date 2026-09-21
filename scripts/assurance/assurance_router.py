#!/usr/bin/env python3
"""Cheapest-first assurance router for changed areas and risk signals."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

LANES = [
    ("compile-static", 1),
    ("targeted-unit", 2),
    ("property-metamorphic", 3),
    ("semantic-golden-synthetic", 4),
    ("reference-oracle", 5),
    ("mutation", 6),
    ("cross-surface-determinism", 7),
    ("ai-independent-review", 8),
    ("human-heldout", 9),
]


def route(profile: dict) -> list[dict]:
    risks = {str(x).lower() for x in profile.get("riskTags", [])}
    changed = " ".join(str(x).lower() for x in profile.get("changedPaths", []))
    selected = {"compile-static", "targeted-unit"}

    if risks & {"reasoning", "security", "evidence", "provenance", "decisioning"}:
        selected.update({"property-metamorphic", "semantic-golden-synthetic"})
    if risks & {"security", "authorization", "rbac", "path", "cutpoint", "truth-kernel"}:
        selected.add("reference-oracle")
    if risks & {"truth-kernel", "tenant-isolation", "authorization", "sealed-evidence"}:
        selected.add("mutation")
    if risks & {"api", "ui", "export", "sponsor", "serialization", "determinism"}:
        selected.add("cross-surface-determinism")
    if profile.get("novelArchitectureMechanism") or profile.get("ambiguousSemantics"):
        selected.add("ai-independent-review")
    if profile.get("releaseClaim") or profile.get("expertComparison"):
        selected.add("human-heldout")

    if "securenow" in changed:
        selected.update({"property-metamorphic", "semantic-golden-synthetic"})
    if "tenant" in changed or "authorization" in changed:
        selected.update({"reference-oracle", "mutation"})

    return [
        {"lane": name, "costOrder": order}
        for name, order in LANES
        if name in selected
    ]


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("profile", type=Path)
    args = parser.parse_args(argv)
    profile = json.loads(args.profile.read_text(encoding="utf-8"))
    print(json.dumps({"schemaVersion": 1, "lanes": route(profile)}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
