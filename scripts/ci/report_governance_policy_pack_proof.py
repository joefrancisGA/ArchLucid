#!/usr/bin/env python3
"""Validate governance policy-pack dry-run proof fixtures for first-pilot sponsor handoff."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path


NON_CERTIFICATION_MARKERS: tuple[str, ...] = (
    "not certification",
    "not regulatory certification",
    "not hipaa",
    "without implying certification",
    "do not claim",
)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def load_fixture(path: Path) -> dict[str, object]:
    payload = json.loads(path.read_text(encoding="utf-8"))

    if not isinstance(payload, dict):
        raise ValueError(f"{path} must contain a JSON object")

    return payload


def run_checks(root: Path, fixture_path: Path) -> list[str]:
    violations: list[str] = []

    if not fixture_path.is_file():
        violations.append(f"missing fixture: {fixture_path.relative_to(root).as_posix()}")
        return violations

    try:
        fixture = load_fixture(fixture_path)
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        violations.append(f"fixture parse error: {exc}")
        return violations

    purpose = fixture.get("purpose")

    if not isinstance(purpose, str) or "architecture review" not in purpose.lower():
        violations.append("fixture purpose must mention architecture review")

    notice = fixture.get("nonCertificationNotice")

    if not isinstance(notice, str) or "certification" not in notice.lower():
        violations.append("fixture must include nonCertificationNotice with certification boundary language")

    sample = fixture.get("sampleDryRun")

    if not isinstance(sample, dict):
        violations.append("fixture sampleDryRun must be an object")
    else:
        evidence = sample.get("evidenceReferences")

        if not isinstance(evidence, list) or len(evidence) == 0:
            violations.append("sampleDryRun.evidenceReferences must contain at least one finding reference")
        else:
            first = evidence[0]

            if not isinstance(first, dict):
                violations.append("evidenceReferences entries must be objects")
            elif not str(first.get("findingId") or "").strip():
                violations.append("evidenceReferences[0].findingId is required")

    for key in ("requiredTestPaths", "requiredDocPaths"):
        paths = fixture.get(key)

        if not isinstance(paths, list) or len(paths) == 0:
            violations.append(f"fixture {key} must be a non-empty array")
            continue

        for rel in paths:
            if not isinstance(rel, str):
                violations.append(f"{key} entries must be strings")
                continue

            if not (root / rel).is_file():
                violations.append(f"missing {key} target: {rel}")

    walkthroughs = (
        root / "docs/library/walkthroughs/AI_GOVERNANCE_REVIEW.md",
        root / "docs/library/walkthroughs/AZURE_SAAS_READINESS_REVIEW.md",
        root / "docs/library/walkthroughs/POLICY_PACK_HEALTHCARE_CLAIMS_PILOT.md",
    )

    for walkthrough in walkthroughs:
        if not walkthrough.is_file():
            violations.append(f"missing walkthrough: {walkthrough.relative_to(root).as_posix()}")
            continue

        text = walkthrough.read_text(encoding="utf-8", errors="replace").lower()

        if not any(marker in text for marker in NON_CERTIFICATION_MARKERS):
            violations.append(
                f"{walkthrough.relative_to(root).as_posix()} must include non-certification boundary language"
            )

    return violations


def render_markdown(root: Path, fixture_path: Path, violations: list[str]) -> str:
    disposition = "PASS" if not violations else "BLOCK"
    fixture = load_fixture(fixture_path)
    sample = fixture.get("sampleDryRun")

    if not isinstance(sample, dict):
        sample = {}

    evidence = sample.get("evidenceReferences")

    if not isinstance(evidence, list):
        evidence = []

    lines = [
        "# Governance policy-pack dry-run proof",
        "",
        "> Architecture-review governance evidence for sponsor packets — not regulatory certification.",
        "",
        f"Generated (UTC): {datetime.now(timezone.utc).isoformat()}",
        "",
        "| Field | Value |",
        "| --- | --- |",
        f"| Disposition | **{disposition}** |",
        f"| Fixture | `{fixture_path.relative_to(root).as_posix()}` |",
        f"| Sample gate blocked | {str(sample.get('gateResult', {}).get('blocked') if isinstance(sample.get('gateResult'), dict) else 'unknown')} |",
        f"| Evidence references | {len(evidence)} |",
        "",
        "## Sample finding reference",
        "",
    ]

    if evidence and isinstance(evidence[0], dict):
        first = evidence[0]
        lines.extend(
            [
                f"- **Finding ID:** `{first.get('findingId')}`",
                f"- **Severity:** {first.get('severity')}",
                f"- **Title:** {first.get('title')}",
                f"- **Evidence ref:** `{first.get('evidenceRef')}`",
                "",
            ]
        )
    else:
        lines.extend(["- None", ""])

    if violations:
        lines.extend(["## Remediation", ""])
        lines.extend(f"- {item}" for item in violations)
        lines.append("")

    lines.extend(
        [
            "## References",
            "",
            "- [`docs/library/PRE_COMMIT_GOVERNANCE_GATE.md`](../../docs/library/PRE_COMMIT_GOVERNANCE_GATE.md)",
            "- API: `POST /v1/governance/policy-packs/dry-run`",
            "",
        ]
    )
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description="Render governance policy-pack dry-run proof artifact.")
    parser.add_argument("--repo-root", type=Path, default=repo_root())
    parser.add_argument(
        "--fixture",
        type=Path,
        default=None,
        help="Fixture JSON path (default: scripts/ci/fixtures/governance-policy-pack-dry-run-proof.json).",
    )
    parser.add_argument("--markdown-out", type=Path, required=True)
    parser.add_argument("--json-summary-out", type=Path, default=None)
    args = parser.parse_args()

    root = args.repo_root.resolve()
    fixture_path = (
        args.fixture
        if args.fixture is not None
        else root / "scripts" / "ci" / "fixtures" / "governance-policy-pack-dry-run-proof.json"
    ).resolve()

    violations = run_checks(root, fixture_path)
    markdown = render_markdown(root, fixture_path, violations)

    markdown_path = args.markdown_out.expanduser().resolve()
    markdown_path.parent.mkdir(parents=True, exist_ok=True)
    markdown_path.write_text(markdown, encoding="utf-8")

    if args.json_summary_out is not None:
        summary = {
            "generatedUtc": datetime.now(timezone.utc).isoformat(),
            "disposition": "PASS" if not violations else "BLOCK",
            "fixturePath": fixture_path.relative_to(root).as_posix(),
            "violationCount": len(violations),
            "violations": violations,
        }
        json_path = args.json_summary_out.expanduser().resolve()
        json_path.parent.mkdir(parents=True, exist_ok=True)
        json_path.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")

    if violations:
        print("report_governance_policy_pack_proof: FAILED", file=sys.stderr)

        for item in violations:
            print(f"  - {item}", file=sys.stderr)

        return 1

    print("report_governance_policy_pack_proof: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
