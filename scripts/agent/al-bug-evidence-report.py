#!/usr/bin/env python3
"""Build evidence-guided /al-bug reseeding inputs from local repository data."""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import xml.etree.ElementTree as ElementTree
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path


ZONE_PATTERN = re.compile(r"^## Zone: (?P<name>.+?)\n(?P<body>.*?)(?=^## Zone: |\Z)", re.MULTILINE | re.DOTALL)
FIELD_PATTERN = re.compile(r"^- \*\*(?P<name>[^:]+):\*\* (?P<value>.*)$", re.MULTILINE)
OPEN_HYPOTHESIS_PATTERN = re.compile(r"^- \[ \] ", re.MULTILINE)


@dataclass(frozen=True)
class Zone:
    zone_id: str
    status: str
    paths: tuple[str, ...]
    open_hypotheses: int


@dataclass(frozen=True)
class CoverageGap:
    path: str
    line_rate: float
    branch_rate: float


@dataclass(frozen=True)
class SurvivingMutant:
    path: str
    line: int
    mutator: str
    replacement: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", type=Path, default=Path.cwd())
    parser.add_argument("--ledger", type=Path, default=Path("docs/library/AL_BUG_HUNT_LEDGER.md"))
    parser.add_argument("--coverage", type=Path)
    parser.add_argument("--mutation", type=Path)
    parser.add_argument("--since-days", type=int, default=7)
    parser.add_argument("--output", type=Path, required=True)
    return parser.parse_args()


def parse_zones(ledger_path: Path) -> list[Zone]:
    text = ledger_path.read_text(encoding="utf-8")
    zones: list[Zone] = []

    for match in ZONE_PATTERN.finditer(text):
        fields = {
            field.group("name").strip().lower(): field.group("value").strip()
            for field in FIELD_PATTERN.finditer(match.group("body"))
        }
        zone_id = fields.get("id", match.group("name").strip())
        paths = tuple(
            item.strip().replace("\\", "/")
            for item in fields.get("paths", "").split(";")
            if item.strip()
        )
        zones.append(
            Zone(
                zone_id=zone_id,
                status=fields.get("status", "unknown"),
                paths=paths,
                open_hypotheses=len(OPEN_HYPOTHESIS_PATTERN.findall(match.group("body"))),
            )
        )

    return zones


def parse_coverage(coverage_path: Path | None) -> list[CoverageGap]:
    if coverage_path is None or not coverage_path.exists():
        return []

    root = ElementTree.parse(coverage_path).getroot()
    rates_by_path: dict[str, list[tuple[float, float]]] = {}

    for class_element in root.findall(".//class"):
        path = class_element.attrib.get("filename", "").replace("\\", "/")
        line_rate = float(class_element.attrib.get("line-rate", "0"))
        branch_rate = float(class_element.attrib.get("branch-rate", "0"))

        if path and (line_rate > 0 or branch_rate > 0):
            rates_by_path.setdefault(path, []).append((line_rate, branch_rate))

    gaps = [
        CoverageGap(
            path=path,
            line_rate=min(rate[0] for rate in rates),
            branch_rate=min(rate[1] for rate in rates),
        )
        for path, rates in rates_by_path.items()
    ]
    return sorted(gaps, key=lambda gap: (gap.branch_rate, gap.line_rate, gap.path))


def parse_surviving_mutants(mutation_path: Path | None) -> list[SurvivingMutant]:
    if mutation_path is None or not mutation_path.exists():
        return []

    report = json.loads(mutation_path.read_text(encoding="utf-8"))
    survivors: list[SurvivingMutant] = []

    for path, file_report in report.get("files", {}).items():
        relative_path = path.replace("\\", "/")

        for mutant in file_report.get("mutants", []):
            if mutant.get("status") != "Survived":
                continue

            location = mutant.get("location", {}).get("start", {})
            survivors.append(
                SurvivingMutant(
                    path=relative_path,
                    line=int(location.get("line", 0)),
                    mutator=str(mutant.get("mutatorName", "unknown")),
                    replacement=str(mutant.get("replacement", "")),
                )
            )

    return sorted(survivors, key=lambda mutant: (mutant.path, mutant.line, mutant.mutator))


def get_recent_changed_files(repo_root: Path, since_days: int) -> list[str]:
    command = [
        "git",
        "log",
        f"--since={since_days}.days",
        "--name-only",
        "--pretty=format:",
        "--diff-filter=ACMR",
    ]
    result = subprocess.run(command, cwd=repo_root, check=True, capture_output=True, text=True)
    return sorted(
        {
            line.strip().replace("\\", "/")
            for line in result.stdout.splitlines()
            if line.strip()
        }
    )


def is_production_path(path: str) -> bool:
    lowered = path.lower()
    return (
        (path.endswith(".cs") or path.endswith(".ts") or path.endswith(".tsx"))
        and ".tests/" not in lowered
        and "/tests/" not in lowered
        and not lowered.endswith(".test.ts")
        and not lowered.endswith(".test.tsx")
        and not lowered.endswith("tests.cs")
        and not path.startswith("scripts/tests/")
    )


def has_recent_test_companion(path: str, changed_files: set[str]) -> bool:
    stem = Path(path).stem.lower()

    return any(
        stem in Path(candidate).stem.lower()
        and (
            ".tests/" in candidate.lower()
            or "/tests/" in candidate.lower()
            or candidate.lower().endswith(".test.ts")
            or candidate.lower().endswith(".test.tsx")
            or candidate.lower().endswith("tests.cs")
        )
        for candidate in changed_files
    )


def path_belongs_to_zone(path: str, zone: Zone) -> bool:
    for zone_path in zone.paths:
        normalized = zone_path.rstrip("/")

        if path == normalized or path.startswith(f"{normalized}/"):
            return True

    return False


def markdown_table(headers: list[str], rows: list[list[str]]) -> list[str]:
    lines = [
        f"| {' | '.join(headers)} |",
        f"| {' | '.join('---' for _ in headers)} |",
    ]
    lines.extend(f"| {' | '.join(row)} |" for row in rows)
    return lines


def build_report(
    zones: list[Zone],
    coverage_gaps: list[CoverageGap],
    mutants: list[SurvivingMutant],
    changed_files: list[str],
    since_days: int,
) -> str:
    changed_set = set(changed_files)
    production_changes = [path for path in changed_files if is_production_path(path)]
    churn_without_tests = [
        path for path in production_changes if not has_recent_test_companion(path, changed_set)
    ]
    catalog_gaps = [
        path
        for path in production_changes
        if not any(path_belongs_to_zone(path, zone) for zone in zones)
    ]
    reseed_zones = [zone for zone in zones if zone.status in {"open", "unseeded"} and zone.open_hypotheses == 0]

    lines = [
        "# `/al-bug` evidence-guided reseed report",
        "",
        f"Generated UTC: `{datetime.now(UTC).isoformat()}`",
        "",
        "This report ranks evidence sources; each row is a hypothesis input, not proof of a defect.",
        "",
        "## Empty-hypothesis zones requiring source reseed",
        "",
    ]
    lines.extend(
        markdown_table(
            ["Zone", "Status", "Paths"],
            [[zone.zone_id, zone.status, "<br>".join(f"`{path}`" for path in zone.paths)] for zone in reseed_zones[:30]],
        )
    )
    lines.extend(["", f"Total requiring reseed: **{len(reseed_zones)}**.", ""])

    lines.extend(["## Coverage-guided branch hotspots", ""])
    lines.extend(
        markdown_table(
            ["Path", "Line coverage", "Branch coverage"],
            [
                [f"`{gap.path}`", f"{gap.line_rate * 100:.1f}%", f"{gap.branch_rate * 100:.1f}%"]
                for gap in coverage_gaps[:30]
            ],
        )
        if coverage_gaps
        else ["No coverage artifact was supplied."]
    )
    lines.extend(["", "## Surviving mutants", ""])
    lines.extend(
        markdown_table(
            ["Path", "Line", "Mutator", "Replacement"],
            [
                [
                    f"`{mutant.path}`",
                    str(mutant.line),
                    mutant.mutator.replace("|", "\\|"),
                    f"`{mutant.replacement.replace('|', '\\|')}`",
                ]
                for mutant in mutants[:50]
            ],
        )
        if mutants
        else ["No surviving mutants were found in the supplied mutation report."]
    )
    lines.extend(["", f"Total surviving mutants: **{len(mutants)}**.", ""])

    lines.extend([f"## Production churn without a matching test filename ({since_days} days)", ""])
    lines.extend([f"- `{path}`" for path in churn_without_tests[:50]] or ["- None detected."])
    lines.extend(["", f"Total: **{len(churn_without_tests)}**.", ""])

    lines.extend(["## Changed production files outside the zone catalog", ""])
    lines.extend([f"- `{path}`" for path in catalog_gaps[:50]] or ["- None detected."])
    lines.extend(["", f"Total: **{len(catalog_gaps)}**.", ""])

    lines.extend(
        [
            "## Required mechanism rotation",
            "",
            "For each selected zone, generate hypotheses from at least three different rows before declaring seed-only:",
            "",
            "1. Sibling-path check asymmetry.",
            "2. Serialization/null/empty/enum/culture/UTC boundary.",
            "3. Cancellation/retry/idempotency/concurrency behavior.",
            "4. Coverage branch with no assertion.",
            "5. Surviving mutant.",
            "6. Recent production churn without matching test churn.",
            "",
        ]
    )

    return "\n".join(lines)


def main() -> int:
    args = parse_args()
    repo_root = args.repo_root.resolve()
    ledger_path = (repo_root / args.ledger).resolve()
    coverage_path = (repo_root / args.coverage).resolve() if args.coverage else None
    mutation_path = (repo_root / args.mutation).resolve() if args.mutation else None
    output_path = (repo_root / args.output).resolve()

    report = build_report(
        zones=parse_zones(ledger_path),
        coverage_gaps=parse_coverage(coverage_path),
        mutants=parse_surviving_mutants(mutation_path),
        changed_files=get_recent_changed_files(repo_root, args.since_days),
        since_days=args.since_days,
    )
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(report, encoding="utf-8")
    print(output_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
