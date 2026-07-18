#!/usr/bin/env python3
"""Run npm audit for archlucid-ui and fail on high/critical vulnerabilities (TB-864)."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

SCHEMA = "archlucid.ui-npm-audit-weekly.v1"
FAIL_SEVERITIES = frozenset({"high", "critical"})


@dataclass(frozen=True)
class AuditEvaluation:
    severity_counts: dict[str, int]
    failing_packages: tuple[str, ...]
    passed: bool


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--ui-dir",
        type=Path,
        default=Path("archlucid-ui"),
        help="Path to the Next.js app root (package-lock.json parent)",
    )
    parser.add_argument(
        "--input-json",
        type=Path,
        help="Optional npm audit --json fixture instead of running npm",
    )
    parser.add_argument("--json-out", type=Path, required=True)
    parser.add_argument("--markdown-out", type=Path, required=True)
    return parser.parse_args(argv)


def load_audit_report(path: Path) -> dict:
    payload = json.loads(path.read_text(encoding="utf-8"))

    if not isinstance(payload, dict):
        raise ValueError("npm audit JSON root must be an object")

    return payload


def run_npm_audit(ui_dir: Path) -> dict:
    if not (ui_dir / "package-lock.json").is_file():
        raise FileNotFoundError(f"package-lock.json not found under {ui_dir}")

    completed = subprocess.run(
        ["npm", "audit", "--json"],
        cwd=ui_dir,
        check=False,
        capture_output=True,
        text=True,
    )

    if not completed.stdout.strip():
        raise RuntimeError(
            f"npm audit produced no stdout (exit {completed.returncode}): {completed.stderr.strip()}"
        )

    try:
        report = json.loads(completed.stdout)
    except json.JSONDecodeError as error:
        raise RuntimeError(f"npm audit stdout was not valid JSON: {error}") from error

    return report


def severity_counts_from_report(report: dict) -> dict[str, int]:
    metadata = report.get("metadata", {})

    if not isinstance(metadata, dict):
        return {"info": 0, "low": 0, "moderate": 0, "high": 0, "critical": 0, "total": 0}

    vulnerabilities = metadata.get("vulnerabilities", {})

    if not isinstance(vulnerabilities, dict):
        return {"info": 0, "low": 0, "moderate": 0, "high": 0, "critical": 0, "total": 0}

    return {
        "info": int(vulnerabilities.get("info", 0) or 0),
        "low": int(vulnerabilities.get("low", 0) or 0),
        "moderate": int(vulnerabilities.get("moderate", 0) or 0),
        "high": int(vulnerabilities.get("high", 0) or 0),
        "critical": int(vulnerabilities.get("critical", 0) or 0),
        "total": int(vulnerabilities.get("total", 0) or 0),
    }


def evaluate_audit_report(report: dict) -> AuditEvaluation:
    counts = severity_counts_from_report(report)
    vulnerabilities = report.get("vulnerabilities", {})
    failing_packages: list[str] = []

    if isinstance(vulnerabilities, dict):
        for package_name, details in sorted(vulnerabilities.items()):
            if not isinstance(details, dict):
                continue

            severity = str(details.get("severity", "")).lower()

            if severity in FAIL_SEVERITIES:
                failing_packages.append(package_name)

    passed = len(failing_packages) == 0 and counts["high"] == 0 and counts["critical"] == 0

    return AuditEvaluation(
        severity_counts=counts,
        failing_packages=tuple(failing_packages),
        passed=passed,
    )


def render_markdown(
    *,
    ui_dir: Path,
    evaluation: AuditEvaluation,
    generated_at_utc: datetime,
) -> str:
    counts = evaluation.severity_counts
    disposition = "PASS" if evaluation.passed else "FAIL"
    failing = ", ".join(evaluation.failing_packages) if evaluation.failing_packages else "(none)"

    return "\n".join(
        [
            "# UI npm audit weekly (TB-864)",
            "",
            f"- **Schema:** `{SCHEMA}`",
            f"- **Generated (UTC):** {generated_at_utc.isoformat()}",
            f"- **UI directory:** `{ui_dir.as_posix()}`",
            f"- **Disposition:** **{disposition}** (fail on high/critical)",
            "",
            "## Severity counts",
            "",
            f"- critical: {counts['critical']}",
            f"- high: {counts['high']}",
            f"- moderate: {counts['moderate']}",
            f"- low: {counts['low']}",
            f"- info: {counts['info']}",
            f"- total: {counts['total']}",
            "",
            "## High/critical packages",
            "",
            failing,
            "",
        ]
    )


def build_summary_payload(
    *,
    ui_dir: Path,
    evaluation: AuditEvaluation,
    generated_at_utc: datetime,
) -> dict:
    return {
        "schema": SCHEMA,
        "generatedAtUtc": generated_at_utc.isoformat(),
        "uiDir": ui_dir.as_posix(),
        "disposition": "PASS" if evaluation.passed else "FAIL",
        "failSeverities": sorted(FAIL_SEVERITIES),
        "severityCounts": evaluation.severity_counts,
        "failingPackages": list(evaluation.failing_packages),
    }


def write_outputs(
    *,
    report: dict,
    summary: dict,
    markdown: str,
    json_out: Path,
    markdown_out: Path,
) -> None:
    json_out.parent.mkdir(parents=True, exist_ok=True)
    markdown_out.parent.mkdir(parents=True, exist_ok=True)

    json_out.write_text(
        json.dumps({"auditReport": report, "summary": summary}, indent=2) + "\n",
        encoding="utf-8",
    )
    markdown_out.write_text(markdown, encoding="utf-8")


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    ui_dir = args.ui_dir.resolve()
    generated_at = datetime.now(timezone.utc)

    if args.input_json:
        report = load_audit_report(args.input_json.resolve())
    else:
        report = run_npm_audit(ui_dir)

    evaluation = evaluate_audit_report(report)
    summary = build_summary_payload(ui_dir=ui_dir, evaluation=evaluation, generated_at_utc=generated_at)
    markdown = render_markdown(ui_dir=ui_dir, evaluation=evaluation, generated_at_utc=generated_at)

    write_outputs(
        report=report,
        summary=summary,
        markdown=markdown,
        json_out=args.json_out.resolve(),
        markdown_out=args.markdown_out.resolve(),
    )

    if evaluation.passed:
        print(f"UI npm audit PASS — total={evaluation.severity_counts['total']}")
        return 0

    print(
        "UI npm audit FAIL — "
        f"high={evaluation.severity_counts['high']} "
        f"critical={evaluation.severity_counts['critical']} "
        f"packages={', '.join(evaluation.failing_packages) or '(metadata only)'}",
        file=sys.stderr,
    )

    return 1


if __name__ == "__main__":
    raise SystemExit(main())
