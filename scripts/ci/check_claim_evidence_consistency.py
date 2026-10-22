#!/usr/bin/env python3
"""Unified claim/evidence consistency gate for trust, pricing, and procurement docs (T2-8)."""

from __future__ import annotations

import argparse
import importlib.util
import json
import re
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

_RULES_PATH = Path(__file__).resolve().parent / "data" / "claim_evidence_rules.v1.json"
_COMPLIANCE = Path(__file__).resolve().parent / "check_compliance_posture_clarity.py"
_OVERCLAIM = Path(__file__).resolve().parent / "check_commercial_overclaim_guard.py"


@dataclass(frozen=True)
class Violation:
    check: str
    location: str
    detail: str

    def as_dict(self) -> dict[str, str]:
        return {"check": self.check, "location": self.location, "detail": self.detail}


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def load_rules() -> dict[str, Any]:
    return json.loads(_RULES_PATH.read_text(encoding="utf-8"))


def load_module(path: Path, name: str):
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def line_has_caveat(line: str, markers: tuple[str, ...]) -> bool:
    lowered = line.lower()
    return any(marker in lowered for marker in markers)


def parse_gate_statuses(status_path: Path) -> dict[str, str]:
    if not status_path.is_file():
        return {}

    statuses: dict[str, str] = {}

    for line in status_path.read_text(encoding="utf-8", errors="replace").splitlines():
        match = re.search(r"\|\s*\*\*(G[1-6])\*\*\s*\|[^|]*\|\s*\*\*(PASS|HOLD|WARN)\*\*", line, re.I)

        if match is None:
            continue

        statuses[match.group(1).upper()] = match.group(2).upper()

    return statuses


def scan_strong_claims(
    root: Path,
    rules: dict[str, Any],
    *,
    paths: list[Path] | None = None,
) -> list[Violation]:
    caveat_markers = tuple(rules.get("caveatMarkers", []))
    violations: list[Violation] = []
    compiled: list[tuple[re.Pattern[str], str]] = []

    for entry in rules.get("strongClaims", []):
        compiled.append((re.compile(entry["pattern"], re.I), entry["label"]))

    gate_statuses = parse_gate_statuses(root / "docs" / "go-to-market" / "CLAIM_READINESS_STATUS.md")

    for gate_rule in rules.get("gateConditionalClaims", []):
        gate_id = str(gate_rule.get("gateId", "")).upper()

        if gate_statuses.get(gate_id) != "HOLD":
            continue

        for block in gate_rule.get("holdStatusBlocks", []):
            compiled.append((re.compile(block["pattern"], re.I), block["label"]))

    target_paths: list[Path] = []

    if paths is not None:
        target_paths = paths
    else:
        for rel_root in rules.get("scanRoots", []):
            base = root / rel_root

            if not base.is_dir():
                continue

            for path in base.rglob("*.md"):
                if "archive" in path.parts:
                    continue

                target_paths.append(path)

    for path in target_paths:
        for index, line in enumerate(path.read_text(encoding="utf-8", errors="replace").splitlines(), start=1):
            if line_has_caveat(line, caveat_markers):
                continue

            stripped = line.strip()

            if stripped.startswith("**Q:") or "never imply" in line.lower():
                continue

            for pattern, label in compiled:
                if pattern.search(line):
                    violations.append(
                        Violation(
                            check="strong-claim",
                            location=f"{path.relative_to(root).as_posix()}:{index}",
                            detail=f"unsupported '{label}' — add caveat or update CLAIM_READINESS_STATUS gate to PASS",
                        ),
                    )

    return violations


def check_required_markers(root: Path, rules: dict[str, Any]) -> list[Violation]:
    violations: list[Violation] = []

    for marker in rules.get("requiredEvidenceMarkers", []):
        rel_path = marker.get("path", "")
        marker_id = marker.get("id", rel_path)
        full_path = root / rel_path

        if not full_path.is_file():
            violations.append(
                Violation(
                    check="evidence-marker",
                    location=rel_path,
                    detail=f"missing required evidence marker file ({marker_id})",
                ),
            )

    return violations


def run_compliance_checks(root: Path) -> tuple[str, list[str]]:
    compliance = load_module(_COMPLIANCE, "check_compliance_posture_clarity")
    violations = compliance.scan_repo(root)
    return ("PASS" if not violations else "FAIL"), violations


def run_overclaim_checks(root: Path) -> tuple[str, list[str]]:
    overclaim = load_module(_OVERCLAIM, "check_commercial_overclaim_guard")
    violations = overclaim.scan_extra_roots(root)

    return ("PASS" if not violations else "FAIL"), violations


def compose_violations(
    root: Path,
    *,
    scan_paths: list[Path] | None = None,
    fixture_mode: bool = False,
) -> list[Violation]:
    rules = load_rules()
    violations: list[Violation] = []

    if fixture_mode:
        if scan_paths is None:
            return [Violation(check="fixture", location="(none)", detail="fixture mode requires scan paths")]

        compliance = load_module(_COMPLIANCE, "check_compliance_posture_clarity")

        for path in scan_paths:
            for item in compliance.scan_file(path):
                location, _, detail = item.partition(": ")
                violations.append(Violation(check="compliance-posture", location=location, detail=detail or item))

        violations.extend(scan_strong_claims(root, rules, paths=scan_paths))

        return violations

    compliance = load_module(_COMPLIANCE, "check_compliance_posture_clarity")
    overclaim = load_module(_OVERCLAIM, "check_commercial_overclaim_guard")

    for item in compliance.scan_repo(root):
        location, _, detail = item.partition(": ")
        violations.append(Violation(check="compliance-posture", location=location, detail=detail or item))

    for item in overclaim.scan_extra_roots(root):
        location, _, detail = item.partition(": ")
        violations.append(Violation(check="commercial-overclaim", location=location, detail=detail or item))

    violations.extend(check_required_markers(root, rules))
    violations.extend(scan_strong_claims(root, rules, paths=scan_paths))

    return violations


def build_report(root: Path, violations: list[Violation]) -> dict[str, Any]:
    compliance_status, compliance_items = run_compliance_checks(root)
    overclaim_extra_status, overclaim_items = run_overclaim_checks(root)

    return {
        "schema": "archlucid.claim-evidence-consistency.v1",
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "disposition": "PASS" if not violations else "FAIL",
        "rulesVersion": load_rules().get("schema"),
        "checks": {
            "compliancePosture": {"disposition": compliance_status, "violationCount": len(compliance_items)},
            "commercialOverclaimExtra": {
                "disposition": overclaim_extra_status,
                "violationCount": len(overclaim_items),
            },
            "evidenceMarkersAndStrongClaims": {
                "disposition": "PASS"
                if not any(v.check in {"evidence-marker", "strong-claim"} for v in violations)
                else "FAIL",
                "violationCount": sum(1 for v in violations if v.check in {"evidence-marker", "strong-claim"}),
            },
        },
        "violations": [v.as_dict() for v in violations],
    }


def render_markdown(report: dict[str, Any]) -> str:
    lines = [
        "# Claim / evidence consistency",
        "",
        f"**Disposition:** {report['disposition']}",
        f"**Generated (UTC):** {report['generatedUtc']}",
        "",
        "## Check summary",
        "",
        "| Check | Disposition | Violations |",
        "| --- | --- | ---: |",
    ]

    for name, payload in report["checks"].items():
        lines.append(f"| {name} | {payload['disposition']} | {payload['violationCount']} |")

    lines.extend(["", "## Violations", ""])

    if not report["violations"]:
        lines.append("_No violations._")
    else:
        for item in report["violations"][:50]:
            lines.append(f"- **{item['check']}** `{item['location']}` — {item['detail']}")

        if len(report["violations"]) > 50:
            lines.append(f"- _... and {len(report['violations']) - 50} more_")

    lines.append("")
    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json-out", type=Path, default=None)
    parser.add_argument("--markdown-out", type=Path, default=None)
    parser.add_argument(
        "--fixture",
        choices=("valid", "invalid"),
        help="Run against CI fixtures instead of the full repo.",
    )
    args = parser.parse_args(argv)

    root = repo_root()
    scan_paths: list[Path] | None = None

    if args.fixture == "valid":
        scan_paths = [root / "scripts" / "ci" / "fixtures" / "claim-evidence-valid.sample.md"]
    elif args.fixture == "invalid":
        scan_paths = [root / "scripts" / "ci" / "fixtures" / "claim-evidence-invalid.sample.md"]

    violations = compose_violations(
        root,
        scan_paths=scan_paths,
        fixture_mode=args.fixture is not None,
    )
    report = build_report(root, violations)

    if args.json_out is not None:
        args.json_out.parent.mkdir(parents=True, exist_ok=True)
        args.json_out.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

    if args.markdown_out is not None:
        args.markdown_out.parent.mkdir(parents=True, exist_ok=True)
        args.markdown_out.write_text(render_markdown(report), encoding="utf-8")

    print(f"Claim/evidence consistency: {report['disposition']}")

    if violations:
        for violation in violations[:40]:
            print(f"{violation.location}: {violation.detail}", file=sys.stderr)

        if len(violations) > 40:
            print(f"... and {len(violations) - 40} more", file=sys.stderr)

        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
