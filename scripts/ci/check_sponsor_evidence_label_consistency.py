#!/usr/bin/env python3
"""Enforce sponsor-facing evidence-basis labels and forbid assurance over-claims."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from check_proof_summary_promise_language import FORBIDDEN_PHRASES, scan_text


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


_REQUIRED_ANCHORS: dict[str, tuple[str, ...]] = {
    "docs/go-to-market/COMMERCIAL_CONVERSION_CHECKLIST.md": (
        "baseline completeness",
        "PilotStrict",
        "DEFERRED_SCOPE",
    ),
    "docs/go-to-market/QUOTE_TO_PROOF_PACKET.md": (
        "roi basis",
        "send rule",
    ),
    "docs/go-to-market/ASSURANCE_STATUS_CANONICAL.md": (
        "do not",
        "allowed buyer wording",
    ),
}


def _required_anchor_missing(text: str, anchors: tuple[str, ...]) -> list[str]:
    lowered = text.lower()
    missing: list[str] = []

    for anchor in anchors:
        if anchor.lower() not in lowered:
            missing.append(anchor)

    return missing


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.parse_args(argv)

    root = repo_root()
    errors: list[str] = []

    for rel_path, anchors in _REQUIRED_ANCHORS.items():
        path = root / rel_path

        if not path.is_file():
            errors.append(f"missing sponsor-facing doc: {rel_path}")
            continue

        text = path.read_text(encoding="utf-8", errors="replace")
        missing = _required_anchor_missing(text, anchors)

        for anchor in missing:
            errors.append(f"{rel_path}: missing required evidence label anchor '{anchor}'")

        errors.extend(scan_text(text, source_label=rel_path))

    if errors:
        for error in errors:
            print(error, file=sys.stderr)

        return 1

    print("check_sponsor_evidence_label_consistency: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
