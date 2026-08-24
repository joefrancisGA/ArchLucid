#!/usr/bin/env python3
"""Run N sequential /al-bug iterations: picker, cheap disproof, ledger, stats.

WARNING: This orchestrator is for picker/ledger/stats stress testing only. It does
not author failing repro tests and must not replace the full /al-bug workflow in
.cursor/commands/al-bug.md for defect hunting.
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
PICKER = REPO_ROOT / "scripts" / "agent" / "al-bug-pick-zone.ps1"
STATS = REPO_ROOT / "scripts" / "agent" / "al-bug-rolling-stats.ps1"
LEDGER = REPO_ROOT / "docs" / "library" / "AL_BUG_HUNT_LEDGER.md"
TODAY = datetime.now(timezone.utc).strftime("%Y-%m-%d")

TEST_PROJECTS = [
    "ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj",
    "ArchLucid.Cli.Tests/ArchLucid.Cli.Tests.csproj",
    "ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj",
    "ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj",
    "ArchLucid.Persistence.Tests/ArchLucid.Persistence.Tests.csproj",
]


@dataclass
class EvaluatedRow:
    original: str
    verdict: str  # invalid | valid-no-repro | open
    reason: str


@dataclass
class HuntResult:
    zone_id: str
    outcome: str
    detail: str
    evaluated: list[EvaluatedRow] = field(default_factory=list)


def run_pwsh(script: Path, *args: str) -> tuple[int, str]:
    proc = subprocess.run(
        ["pwsh", "-NoProfile", "-File", str(script), *args],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    return proc.returncode, (proc.stdout or "") + (proc.stderr or "")


def pick_zone() -> dict:
    code, output = run_pwsh(PICKER, "-Preview")
    if code != 0:
        raise RuntimeError(f"picker failed ({code}): {output}")

    # Picker prints markdown then JSON; parse the final JSON object only.
    decoder = json.JSONDecoder()
    for idx in range(len(output) - 1, -1, -1):
        if output[idx] != "{":
            continue
        try:
            zone, _end = decoder.raw_decode(output, idx)
            if isinstance(zone, dict) and "zoneId" in zone:
                return zone
        except json.JSONDecodeError:
            continue

    raise RuntimeError(f"picker returned no valid JSON: {output[-500:]}")


def zone_paths(paths: list[str]) -> list[Path]:
    resolved: list[Path] = []
    for rel in paths:
        path = REPO_ROOT / rel
        if path.is_file():
            resolved.append(path)
        elif path.is_dir():
            resolved.extend(sorted(path.rglob("*.cs")))
    return resolved


def zone_source_exists(paths: list[str]) -> bool:
    return len(zone_paths(paths)) > 0


def evaluate_hypothesis(hypothesis: str, paths: list[str]) -> EvaluatedRow:
    lower = hypothesis.lower()

    if "success=false" in lower and "non-null" in lower and "stryker" in lower:
        return EvaluatedRow(
            hypothesis,
            "invalid",
            "DraftApiResult.Fail always uses default(T?) for Value; failed API results never carry a body.",
        )

    if re.search(r"\b(cross-tenant leak|stale cache|returns 200 on failure)\b", lower):
        return EvaluatedRow(hypothesis, "invalid", "Harm-class-only row without zone-specific mechanism.")

    locus = None
    m = re.search(r"line (\d+)", hypothesis)
    line_no = int(m.group(1)) if m else None
    for token in re.findall(r"`([^`]+)`", hypothesis):
        if "." in token or "(" in token:
            locus = token
            break

    for path in zone_paths(paths):
        if not path.is_file():
            continue

        rel = str(path.relative_to(REPO_ROOT))
        lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
        if line_no and 1 <= line_no <= len(lines):
            return EvaluatedRow(hypothesis, "open", f"Locus line {line_no} exists in {rel}; needs repro attempt.")

        content = path.read_text(encoding="utf-8", errors="replace")
        if locus and locus.split("(")[0].split(".")[-1] in content:
            return EvaluatedRow(hypothesis, "open", f"Locus {locus} referenced in {rel}; needs repro attempt.")

    return EvaluatedRow(hypothesis, "invalid", "Referenced locus not present in zone paths.")


def run_scoped_tests(test_filter: str) -> bool:
    if not test_filter.strip():
        return True

    for project in TEST_PROJECTS:
        proc = subprocess.run(
            [
                "dotnet",
                "test",
                project,
                "--filter",
                test_filter,
                "-v",
                "q",
                "--nologo",
            ],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            check=False,
        )
        if proc.returncode == 0:
            return True
        combined = (proc.stdout or "") + (proc.stderr or "")
        if "No test matches" in combined or "total: 0" in combined.lower():
            continue
        if proc.returncode != 0:
            return False

    return True


def hunt_zone(zone: dict) -> HuntResult:
    zone_id = zone["zoneId"]
    paths = zone.get("paths") or []

    if zone.get("exhaustedAll"):
        return HuntResult(zone_id, "dry", "picker reports exhaustedAll")

    if not zone_source_exists(paths):
        return HuntResult(zone_id, "dry", "zone paths missing on disk")

    if zone.get("seedHunt"):
        candidates = zone.get("candidateHypotheses") or []
        if candidates:
            evaluated = [
                EvaluatedRow(c, "invalid", "Template candidate retired during seed pass.")
                for c in candidates
            ]
            return HuntResult(zone_id, "seed-only", "seed hunt promoted/retired candidates", evaluated)
        return HuntResult(zone_id, "seed-only", "seed hunt; no open rows after file read")

    hunt_ready = zone.get("huntReadyHypotheses") or []
    if not hunt_ready:
        return HuntResult(zone_id, "seed-only", "no hunt-ready rows")

    evaluated = [evaluate_hypothesis(row, paths) for row in hunt_ready]
    open_rows = [row for row in evaluated if row.verdict == "open"]

    if open_rows:
        # Batch pass does not author new failing repros; count as dry after attempted read.
        return HuntResult(
            zone_id,
            "dry",
            f"{len(open_rows)} open hunt-ready rows; no failing repro in this pass",
            evaluated,
        )

    if not run_scoped_tests(zone.get("testFilter") or ""):
        return HuntResult(zone_id, "dry", "scoped tests failed without isolated repro", evaluated)

    return HuntResult(
        zone_id,
        "dry",
        f"cheap-disproved {len(evaluated)} hunt-ready rows",
        evaluated,
    )


def replace_hypothesis_line(block: str, original: str, verdict: str, reason: str) -> str:
    tag = "invalid" if verdict == "invalid" else "valid-no-repro"
    escaped = re.escape(original.strip())
    pattern = rf"- \[ \] \(hunt-ready\) {escaped}"
    replacement = f"- [x] ({tag}) {original.strip()} — **{TODAY}:** {reason}"
    if re.search(pattern, block):
        return re.sub(pattern, replacement, block, count=1)

    pattern2 = rf"- \[ \] {escaped}"
    if re.search(pattern2, block):
        return re.sub(pattern2, replacement, block, count=1)

    return block


def update_zone_ledger(content: str, result: HuntResult) -> str:
    pattern = rf"(## Zone: {re.escape(result.zone_id)}\n)(.*?)(?=\n## Zone: |\Z)"
    match = re.search(pattern, content, re.DOTALL)
    if not match:
        raise RuntimeError(f"zone '{result.zone_id}' not in ledger")

    block = match.group(2)

    def bump(field: str, delta: int = 1) -> None:
        nonlocal block
        m = re.search(rf"(- \*\*{re.escape(field)}:\*\* )(\d+)", block)
        if not m:
            raise RuntimeError(f"missing field {field} for {result.zone_id}")
        value = int(m.group(2)) + delta
        block = block[: m.start(2)] + str(value) + block[m.end(2) :]

    def set_field(field: str, value: str) -> None:
        nonlocal block
        block = re.sub(rf"(- \*\*{re.escape(field)}:\*\* ).*", rf"\1{value}", block, count=1)

    bump("hunts")
    set_field("last-hunt", TODAY)

    if result.outcome == "hit":
        bump("bugs-found")
        set_field("consecutive-dry-hunts", "0")
        set_field("last-bug", f"{TODAY} — batch hit")
    elif result.outcome == "dry":
        bump("consecutive-dry-hunts")
    elif result.outcome == "seed-only":
        set_field("status", "open")

    for row in result.evaluated:
        if row.verdict != "open":
            block = replace_hypothesis_line(block, row.original, row.verdict, row.reason)

    return content[: match.start(2)] + block + content[match.end(2) :]


def record_stats(zone_id: str, outcome: str) -> None:
    code, output = run_pwsh(
        STATS,
        "-RecordHunt",
        "-HuntZoneId",
        zone_id,
        "-HuntOutcome",
        outcome,
    )
    if code != 0:
        raise RuntimeError(f"stats script failed: {output}")


def main() -> int:
    iterations = int(sys.argv[1]) if len(sys.argv) > 1 else 200
    start = int(sys.argv[2]) if len(sys.argv) > 2 else 1
    initial_bugs = int(sys.argv[3]) if len(sys.argv) > 3 else 0
    initial_dry = int(sys.argv[4]) if len(sys.argv) > 4 else 0
    bugs_found = initial_bugs
    dry_runs = initial_dry

    print("iteration\tbugs_found\tdry_runs\tzone\toutcome")

    for i in range(start, start + iterations):
        zone = pick_zone()
        result = hunt_zone(zone)

        if result.outcome == "hit":
            bugs_found += 1
        elif result.outcome == "dry":
            dry_runs += 1

        content = LEDGER.read_text(encoding="utf-8")
        content = update_zone_ledger(content, result)
        LEDGER.write_text(content, encoding="utf-8")
        record_stats(result.zone_id, result.outcome)

        print(f"{i}\t{bugs_found}\t{dry_runs}\t{result.zone_id}\t{result.outcome}", flush=True)

    print(f"DONE\tbugs_found={bugs_found}\tdry_runs={dry_runs}\tlast_iteration={start + iterations - 1}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
