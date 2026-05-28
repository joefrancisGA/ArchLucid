#!/usr/bin/env python3
"""Verify Specialty accelerator buyer-job and walkthrough handoff docs remain V1-safe."""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path


CATALOG_README = Path("docs/library/walkthroughs/README.md")

ACCELERATOR_WALKTHROUGHS: tuple[Path, ...] = (
    Path("docs/library/walkthroughs/AZURE_SAAS_READINESS_REVIEW.md"),
    Path("docs/library/walkthroughs/AI_GOVERNANCE_REVIEW.md"),
    Path("docs/library/walkthroughs/POLICY_PACK_HEALTHCARE_CLAIMS_PILOT.md"),
)

ACCELERATOR_BUYER_JOBS: tuple[Path, ...] = (
    Path("docs/go-to-market/buyer-jobs/AZURE_SAAS_READINESS.md"),
    Path("docs/go-to-market/buyer-jobs/AI_GOVERNANCE_REVIEW.md"),
    Path("docs/go-to-market/buyer-jobs/HEALTHCARE_CLAIMS_POLICY_REVIEW.md"),
)

V11_REQUIRED_PATTERNS: tuple[tuple[re.Pattern[str], str], ...] = (
    (
        re.compile(r"\brequires?\b[^\n]{0,80}\b(Jira|ServiceNow|Confluence|Slack|Teams|MCP)\b", re.IGNORECASE),
        "requires V1.1 connector",
    ),
    (
        re.compile(r"\bmust\b[^\n]{0,80}\b(Jira|ServiceNow|Confluence|Slack|Teams|MCP)\b", re.IGNORECASE),
        "must use V1.1 connector",
    ),
)

OPTIONAL_MARKERS: tuple[str, ...] = (
    "not required",
    "no ",
    "without ",
    "optional",
    "v1.1",
    "defer",
    "do not require",
)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _extract_markdown_links(text: str) -> list[str]:
    return re.findall(r"\[[^\]]+\]\(([^)]+)\)", text)


def _resolve_link(root: Path, source: Path, href: str) -> Path | None:
    cleaned = href.strip()

    if cleaned.startswith("http://") or cleaned.startswith("https://") or cleaned.startswith("#"):
        return None

    if cleaned.startswith("/"):
        candidate = root / cleaned.lstrip("/")
        return candidate

    return (source.parent / cleaned).resolve()


def _line_has_optional_marker(line: str) -> bool:
    lowered = line.lower()
    return any(marker in lowered for marker in OPTIONAL_MARKERS)


def _scan_v11_requirements(path: Path, text: str) -> list[str]:
    violations: list[str] = []

    for index, line in enumerate(text.splitlines(), start=1):
        if _line_has_optional_marker(line):
            continue

        for pattern, label in V11_REQUIRED_PATTERNS:
            if pattern.search(line):
                violations.append(f"{path.as_posix()}:{index}: {label} — {line.strip()}")

    return violations


def _broken_links(root: Path, path: Path, text: str) -> list[str]:
    broken: list[str] = []

    for href in _extract_markdown_links(text):
        target = _resolve_link(root, path, href)

        if target is None:
            continue

        repo_relative = None

        try:
            repo_relative = target.relative_to(root)
        except ValueError:
            broken.append(f"{path.as_posix()}: external-relative link missing in repo: {href}")
            continue

        if not target.is_file():
            broken.append(f"{path.as_posix()}: broken link `{href}` -> {repo_relative.as_posix()}")

    return broken


def run_checks(root: Path) -> list[str]:
    violations: list[str] = []

    catalog = root / CATALOG_README
    if not catalog.is_file():
        violations.append(f"missing accelerator catalog: {CATALOG_README.as_posix()}")
    else:
        catalog_text = catalog.read_text(encoding="utf-8", errors="replace")
        violations.extend(_broken_links(root, catalog, catalog_text))

        if "Specialty" not in catalog_text:
            violations.append(f"{CATALOG_README.as_posix()}: missing Specialty accelerator framing")

    for rel in (*ACCELERATOR_WALKTHROUGHS, *ACCELERATOR_BUYER_JOBS):
        path = root / rel

        if not path.is_file():
            violations.append(f"missing accelerator doc: {rel.as_posix()}")
            continue

        text = path.read_text(encoding="utf-8", errors="replace")
        violations.extend(_broken_links(root, path, text))
        violations.extend(_scan_v11_requirements(path, text))

        if "healthcare" in rel.as_posix().lower() or "claims" in rel.as_posix().lower():
            if "synthetic" not in text.lower() and "fabricated" not in text.lower() and "demo" not in text.lower():
                violations.append(
                    f"{rel.as_posix()}: healthcare/regulatory storyline must mention synthetic or demo labeling"
                )

    return violations


def render_markdown(*, disposition: str, violations: list[str]) -> str:
    lines = [
        "# Accelerator handoff acceptance",
        "",
        "| Field | Value |",
        "| --- | --- |",
        f"| Disposition | **{disposition}** |",
        f"| Generated (UTC) | {datetime.now(timezone.utc).isoformat()} |",
        f"| Walkthroughs checked | {len(ACCELERATOR_WALKTHROUGHS)} |",
        f"| Buyer-job pages checked | {len(ACCELERATOR_BUYER_JOBS)} |",
        "",
        "_Specialty accelerators must link to V1-only surfaces and must not require V1.1 connectors._",
        "",
    ]

    if violations:
        lines.extend(["## Violations", ""])
        lines.extend(f"- {item}" for item in violations)
        lines.append("")
    else:
        lines.extend(["## Result", "", "All accelerator handoff docs passed V1-safe acceptance checks.", ""])

    return "\n".join(lines)


def build_json_summary(*, disposition: str, violations: list[str]) -> dict[str, object]:
    return {
        "generated_utc": datetime.now(timezone.utc).isoformat(),
        "disposition": disposition,
        "violations": violations,
        "walkthrough_count": len(ACCELERATOR_WALKTHROUGHS),
        "buyer_job_count": len(ACCELERATOR_BUYER_JOBS),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Check Specialty accelerator handoff docs.")
    parser.add_argument("--markdown-out", type=Path, default=None)
    parser.add_argument("--json-summary-out", type=Path, default=None)
    args = parser.parse_args()

    root = repo_root()
    violations = run_checks(root)
    disposition = "PASS" if not violations else "HOLD"

    if args.markdown_out is not None:
        markdown_path = args.markdown_out.expanduser().resolve()
        markdown_path.parent.mkdir(parents=True, exist_ok=True)
        markdown_path.write_text(render_markdown(disposition=disposition, violations=violations), encoding="utf-8")

    if args.json_summary_out is not None:
        json_path = args.json_summary_out.expanduser().resolve()
        json_path.parent.mkdir(parents=True, exist_ok=True)
        json_path.write_text(
            json.dumps(build_json_summary(disposition=disposition, violations=violations), indent=2) + "\n",
            encoding="utf-8",
        )

    if violations:
        print("accelerator handoff doc violations:", file=sys.stderr)

        for item in violations:
            print(f"  - {item}", file=sys.stderr)

        return 1

    print("check_accelerator_handoff_docs: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
