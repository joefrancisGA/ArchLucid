#!/usr/bin/env python3
"""Validate sanitized committed real-mode AgentResult fixtures under tests/eval-corpus/agent-results."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

_FORBIDDEN_PATTERNS = (
    re.compile(r"sk-[A-Za-z0-9]{10,}", re.IGNORECASE),
    re.compile(r"api[_-]?key", re.IGNORECASE),
    re.compile(r"BEGIN (RSA |OPENSSH )?PRIVATE KEY", re.IGNORECASE),
    re.compile(r"chain[_-]?of[_-]?thought", re.IGNORECASE),
)

_REQUIRED_TOP_LEVEL = (
    "resultId",
    "taskId",
    "runId",
    "agentType",
    "claims",
    "evidenceRefs",
    "confidence",
    "findings",
    "createdUtc",
)

_FINDING_CONTENT_FIELDS = ("description", "message", "title", "detail")

_TRACE_LIST_KEYS = (
    "graphNodeIdsExamined",
    "rulesApplied",
    "decisionsTaken",
    "alternativePathsConsidered",
    "notes",
)


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _load(path: Path) -> dict[str, object]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        raise ValueError("root must be a JSON object")
    return payload


def _scan_forbidden(text: str) -> list[str]:
    hits: list[str] = []
    for pattern in _FORBIDDEN_PATTERNS:
        if pattern.search(text):
            hits.append(pattern.pattern)
    return hits


def _validate_finding(index: int, finding: object, *, require_trace: bool) -> list[str]:
    errors: list[str] = []
    if not isinstance(finding, dict):
        return [f"findings[{index}] must be an object"]

    severity = finding.get("severity")
    if not isinstance(severity, str) or not severity.strip():
        errors.append(f"findings[{index}].severity must be a non-empty string")

    if not any(
        isinstance(finding.get(field), str) and str(finding.get(field)).strip()
        for field in _FINDING_CONTENT_FIELDS
    ):
        errors.append(
            f"findings[{index}] needs non-empty content in one of: {', '.join(_FINDING_CONTENT_FIELDS)}"
        )

    if not require_trace:
        return errors

    trace = finding.get("trace")
    if not isinstance(trace, dict):
        errors.append(f"findings[{index}].trace must be an object for release-grade fixtures")
        return errors

    for key in _TRACE_LIST_KEYS:
        value = trace.get(key)
        if not isinstance(value, list):
            errors.append(f"findings[{index}].trace.{key} must be an array")

    return errors


def validate_fixture(path: Path, *, require_trace: bool) -> list[str]:
    errors: list[str] = []
    raw = path.read_text(encoding="utf-8")
    errors.extend(f"forbidden pattern {pat}" for pat in _scan_forbidden(raw))

    try:
        doc = _load(path)
    except (json.JSONDecodeError, ValueError) as exc:
        return [str(exc)]

    for key in _REQUIRED_TOP_LEVEL:
        if key not in doc:
            errors.append(f"missing required top-level property '{key}'")

    findings = doc.get("findings")
    if not isinstance(findings, list) or len(findings) == 0:
        errors.append("findings must be a non-empty array")
    elif isinstance(findings, list):
        for index, finding in enumerate(findings):
            errors.extend(_validate_finding(index, finding, require_trace=require_trace))

    return errors


def render_markdown(rows: list[dict[str, object]]) -> str:
    lines = [
        "# Committed real-mode LLM fixture validation",
        "",
        "| Fixture | Result | Detail |",
        "| --- | --- | --- |",
    ]
    for row in rows:
        lines.append(
            f"| `{row['file']}` | **{row['result']}** | {row['detail']} |"
        )
    lines.append("")
    lines.append(
        "Simulator baseline remains in `tests/eval-corpus/agent-results/*.simulator.json`. "
        "This report validates only committed `*.real.json` snapshots."
    )
    lines.append("")
    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--agent-results-dir",
        type=Path,
        default=_repo_root() / "tests" / "eval-corpus" / "agent-results",
    )
    parser.add_argument("--markdown-out", type=Path, default=None)
    parser.add_argument(
        "--require-trace",
        action="store_true",
        help="Require ExplainabilityTrace on every finding (release-grade fixtures).",
    )
    args = parser.parse_args(argv)

    folder = args.agent_results_dir
    if not folder.is_dir():
        print(f"::error::Missing directory {folder}")
        return 1

    real_files = sorted(folder.glob("*.real.json"))
    rows: list[dict[str, object]] = []
    invalid = 0

    if not real_files:
        rows.append(
            {
                "file": "(none)",
                "result": "MISSING",
                "detail": "No committed *.real.json fixtures — RC/sponsor handoff should capture Topology/Cost/Compliance/Critic real-mode evidence.",
            }
        )
    else:
        for path in real_files:
            errors = validate_fixture(path, require_trace=args.require_trace)
            if errors:
                invalid += 1
                rows.append(
                    {
                        "file": path.name,
                        "result": "INVALID",
                        "detail": "; ".join(errors[:4])
                        + (" …" if len(errors) > 4 else ""),
                    }
                )
            else:
                rows.append(
                    {
                        "file": path.name,
                        "result": "VALID",
                        "detail": "Structural and secret-safety checks passed.",
                    }
                )

    if args.markdown_out is not None:
        args.markdown_out.parent.mkdir(parents=True, exist_ok=True)
        args.markdown_out.write_text(render_markdown(rows), encoding="utf-8")

    if invalid:
        print(f"::error::{invalid} invalid committed real-mode fixture(s).")
        return 1

    if not real_files:
        print("::warning::No committed real-mode fixtures present.")
        return 0

    print(f"Validated {len(real_files)} committed real-mode fixture(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
