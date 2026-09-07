#!/usr/bin/env python3
"""PR lint: new high-impact (proven) rows must name closed harm tokens (ABQ-40)."""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path

_AGENT_DIR = Path(__file__).resolve().parent
if str(_AGENT_DIR) not in sys.path:
    sys.path.insert(0, str(_AGENT_DIR))

from al_bug_ledger import DEFAULT_LEDGER_PATH, parse_zone_impacts, parse_zones  # noqa: E402

REPO_ROOT = Path(__file__).resolve().parents[2]
PROVEN_ADDED = re.compile(r"^\+\s*-\s+\[[xX]\]\s+\(proven\)\s+(.+)$")
ID_ADDED = re.compile(r"^\+\s*-\s+\*\*id:\*\*\s+(.+?)\s*$")
IMPACT_OVERRIDE = re.compile(r"\[impact:(medium|low)\]", re.IGNORECASE)


def names_closed_harm_token(text: str) -> bool:
    lowered = text.lower()
    if "cross-tenant" in lowered and "200" in lowered:
        return True
    if any(token in lowered for token in ("secret", "password", "apikey", "api-key")) and any(
        surface in lowered for surface in ("summary", "export", "packet")
    ):
        return True
    if "committed" in lowered and "manifest" in lowered:
        return True
    if "200" in lowered and any(code in lowered for code in ("403", "404")):
        return True
    return False


def zone_for_added_line(ledger_text: str, line_index: int) -> str | None:
    lines = ledger_text.splitlines()
    for idx in range(line_index, -1, -1):
        if lines[idx].startswith("## Zone:"):
            body_start = idx
            body = "\n".join(lines[body_start : line_index + 1])
            zones = parse_zones(body + "\n## Zone: sentinel\n- **id:** sentinel\n")
            for zone_id, zone_body in zones.items():
                if zone_id == "sentinel":
                    continue
                if zone_body in body or body.endswith(zone_body.strip()):
                    return zone_id
            break
    return None


def resolve_zone_from_context(ledger_text: str, target_line: str) -> str | None:
    zones = parse_zones(ledger_text)
    position = ledger_text.find(target_line)
    if position < 0:
        return None
    prefix = ledger_text[:position]
    last_header = prefix.rfind("## Zone:")
    if last_header < 0:
        return None
    tail = ledger_text[last_header:]
    for zone_id, body in zones.items():
        if body in tail[: len(body) + 20]:
            return zone_id
    id_match = re.search(r"-\s+\*\*id:\*\*\s+(.+?)\s*$", prefix[last_header:], re.MULTILINE)
    if id_match:
        return id_match.group(1).strip()
    return None


def lint_added_proven_lines(diff_text: str, ledger_text: str) -> list[str]:
    impacts = parse_zone_impacts(ledger_text)
    violations: list[str] = []
    current_zone: str | None = None
    for line in diff_text.splitlines():
        id_match = ID_ADDED.match(line)
        if id_match:
            current_zone = id_match.group(1).strip()
            continue
        match = PROVEN_ADDED.match(line)
        if not match:
            continue
        row_text = match.group(1).strip()
        if IMPACT_OVERRIDE.search(row_text):
            continue
        if names_closed_harm_token(row_text):
            continue
        zone_id = current_zone or resolve_zone_from_context(ledger_text, row_text)
        if zone_id is None:
            continue
        if impacts.get(zone_id) != "high":
            continue
        violations.append(row_text)
    return violations


def load_diff(diff_path: Path | None, diff_ref: str | None) -> str:
    if diff_path is not None:
        return diff_path.read_text(encoding="utf-8")
    if diff_ref:
        completed = subprocess.run(
            ["git", "diff", diff_ref, "--", str(DEFAULT_LEDGER_PATH.relative_to(REPO_ROOT))],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            check=False,
        )
        return completed.stdout or ""
    return ""


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ledger", type=Path, default=DEFAULT_LEDGER_PATH)
    parser.add_argument("--diff", type=Path, help="Unified diff of the ledger.")
    parser.add_argument(
        "--diff-ref",
        default="origin/master...",
        help="Git diff ref when --diff is omitted (default origin/master...).",
    )
    args = parser.parse_args()

    ledger_text = args.ledger.read_text(encoding="utf-8")
    diff_text = load_diff(args.diff, args.diff_ref if args.diff is None else None)
    if not diff_text.strip():
        return 0

    violations = lint_added_proven_lines(diff_text, ledger_text)
    if violations:
        print("New high-impact (proven) rows without closed harm tokens or [impact:medium|low]:")
        for row in violations:
            print(f"  - {row}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
