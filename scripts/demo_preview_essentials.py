#!/usr/bin/env python3
"""Validate GET /v1/demo/preview JSON essentials for golden demo workspace checks."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any


SECRET_PATTERNS: tuple[re.Pattern[str], ...] = (
    re.compile(r"AKIA[0-9A-Z]{16}"),
    re.compile(r"-----BEGIN (?:RSA |EC )?PRIVATE KEY-----"),
    re.compile(r"(?i)connectionstring\s*=\s*[^;\s]+(?:password|pwd|secret)"),
    re.compile(r"(?i)(api[_-]?key|client[_-]?secret|password)\s*[:=]\s*['\"]?[A-Za-z0-9+/=_-]{12,}"),
)


def validate_preview_payload(payload: dict[str, Any]) -> list[str]:
    """Return stable HOLD reason codes when preview JSON is buyer-unsafe or incomplete."""
    violations: list[str] = []

    if payload.get("isDemoData") is not True:
        violations.append("demo-preview-isDemoData-missing-or-false")

    manifest = payload.get("manifest")
    if not isinstance(manifest, dict) or not str(manifest.get("manifestId", "")).strip():
        violations.append("demo-preview-manifest-summary-missing")

    authority = payload.get("authorityChain")
    if not isinstance(authority, dict) or not str(authority.get("goldenManifestId", "")).strip():
        violations.append("demo-preview-authority-chain-missing")

    artifacts = payload.get("artifacts")
    if not isinstance(artifacts, list) or len(artifacts) == 0:
        violations.append("demo-preview-artifacts-empty")

    run_explanation = payload.get("runExplanation")
    if not isinstance(run_explanation, dict):
        violations.append("demo-preview-run-explanation-missing")
    else:
        if not str(run_explanation.get("overallAssessment", "")).strip():
            violations.append("demo-preview-run-explanation-incomplete")

        explanation = run_explanation.get("explanation")
        if not isinstance(explanation, dict) or not str(explanation.get("summary", "")).strip():
            violations.append("demo-preview-explanation-summary-missing")

    run = payload.get("run")
    if not isinstance(run, dict) or not str(run.get("runId", "")).strip():
        violations.append("demo-preview-run-id-missing")

    serialized = json.dumps(payload, ensure_ascii=False)
    for pattern in SECRET_PATTERNS:
        if pattern.search(serialized):
            violations.append("demo-preview-secret-like-token-detected")
            break

    return violations


def format_disposition(*, ok: bool, violations: list[str]) -> str:
    disposition = "PASS" if ok else "HOLD"
    lines = [f"Demo preview disposition: {disposition}"]

    if violations:
        lines.append("Reasons:")
        lines.extend(f"  - {code}" for code in violations)

    return "\n".join(lines)


def load_payload(path: Path) -> dict[str, Any]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise ValueError("preview JSON root must be an object")
    return data


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Validate demo preview JSON essentials.")
    parser.add_argument("--validate-file", type=Path, help="Validate a saved preview JSON file.")
    parser.add_argument("--json-stdin", action="store_true", help="Read preview JSON from stdin.")
    args = parser.parse_args(argv)

    if args.validate_file is not None:
        payload = load_payload(args.validate_file)
    elif args.json_stdin:
        payload = json.load(sys.stdin)
        if not isinstance(payload, dict):
            print("error: stdin JSON root must be an object", file=sys.stderr)
            return 1
    else:
        parser.print_help()
        return 1

    violations = validate_preview_payload(payload)
    print(format_disposition(ok=not violations, violations=violations))

    return 0 if not violations else 2


if __name__ == "__main__":
    raise SystemExit(main())
