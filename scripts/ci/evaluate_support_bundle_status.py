#!/usr/bin/env python3
"""Evaluate support-bundle attachment status for release evidence (T2-6)."""

from __future__ import annotations

import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

_SCHEMA = "archlucid.support-bundle-status.v1"
_REQUIRED_MARKERS = ("support-bundle", "support_bundle", "support-summary")
_SECRET_PATTERNS: tuple[tuple[str, re.Pattern[str]], ...] = (
    ("sql_connection_string", re.compile(r"\b(Server|Data Source)=.+;\s*(Password|Pwd)=", re.IGNORECASE)),
    ("bearer_token", re.compile(r"\bBearer\s+[A-Za-z0-9._~+/=-]{20,}", re.IGNORECASE)),
    ("api_key_assignment", re.compile(r"\b(api[_-]?key|secret|password)\s*[:=]\s*['\"]?[A-Za-z0-9._~+/=-]{12,}", re.IGNORECASE)),
)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def evaluate(bundle_dir: Path) -> dict[str, Any]:
    matched_paths = [
        path
        for path in bundle_dir.rglob("*")
        if path.is_file()
        and path.name != "support-bundle-status.json"
        and any(marker in path.name.lower() for marker in _REQUIRED_MARKERS)
    ]
    matches = [path.relative_to(bundle_dir).as_posix() for path in matched_paths]
    redaction_findings: list[dict[str, Any]] = []

    for path in matched_paths:
        try:
            text = path.read_text(encoding="utf-8", errors="replace")
        except OSError:
            redaction_findings.append({"file": path.relative_to(bundle_dir).as_posix(), "pattern": "unreadable", "line": None})
            continue

        for line_no, line in enumerate(text.splitlines(), start=1):
            for name, pattern in _SECRET_PATTERNS:
                if pattern.search(line):
                    redaction_findings.append({"file": path.relative_to(bundle_dir).as_posix(), "pattern": name, "line": line_no})

    if redaction_findings:
        status = "HOLD"
    elif matches:
        status = "PASS"
    else:
        status = "MISSING"

    return {
        "schema": _SCHEMA,
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "status": status,
        "matchedFiles": sorted(matches),
        "redactionStatus": "FAIL" if redaction_findings else ("PASS" if matches else "NOT_EVALUATED"),
        "redactionFindings": redaction_findings,
        "detail": (
            "support bundle contains possible unredacted secret patterns"
            if redaction_findings
            else ("support bundle or support-summary artifact present" if matches else "no support bundle artifact attached")
        ),
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--bundle-dir", type=Path, required=True)
    parser.add_argument("--json-out", type=Path, required=True)
    args = parser.parse_args(argv)
    summary = evaluate(args.bundle_dir.resolve())
    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
