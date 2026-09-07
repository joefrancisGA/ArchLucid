#!/usr/bin/env python3
"""Warn or fail when ledger zone path prefixes point at missing files (ABQ-44)."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

_AGENT_DIR = Path(__file__).resolve().parent
if str(_AGENT_DIR) not in sys.path:
    sys.path.insert(0, str(_AGENT_DIR))

from al_bug_ledger import DEFAULT_LEDGER_PATH, parse_zone_paths, parse_zones  # noqa: E402

REPO_ROOT = Path(__file__).resolve().parents[2]

RETIRED_ZONE_ALLOWLIST = frozenset(
    {
        "archlucid-core",
    }
)


def parse_zone_statuses(ledger_text: str) -> dict[str, str]:
    statuses: dict[str, str] = {}
    zones = parse_zones(ledger_text)
    for zone_id, body in zones.items():
        for line in body.splitlines():
            stripped = line.strip()
            if stripped.startswith("- **status:**"):
                statuses[zone_id] = stripped.split(":**", 1)[1].strip().lower()
                break
    return statuses


def path_prefix_exists(repo_root: Path, prefix: str) -> bool:
    normalized = prefix.replace("\\", "/").strip()
    if not normalized:
        return False
    candidate = repo_root / normalized
    if candidate.exists():
        return True
    if normalized.endswith("/"):
        return candidate.exists()
    parent = candidate.parent
    if parent.exists() and parent.is_dir():
        name = candidate.name
        for child in parent.iterdir():
            if child.name.startswith(name):
                return True
    return False


def lint_zone_paths(ledger_text: str, repo_root: Path) -> list[tuple[str, str]]:
    ghosts: list[tuple[str, str]] = []
    statuses = parse_zone_statuses(ledger_text)
    for zone in parse_zone_paths(ledger_text):
        if zone.zone_id in RETIRED_ZONE_ALLOWLIST:
            continue
        status = statuses.get(zone.zone_id, "open")
        if status == "exhausted" and zone.zone_id in RETIRED_ZONE_ALLOWLIST:
            continue
        for prefix in zone.paths:
            if not path_prefix_exists(repo_root, prefix):
                ghosts.append((zone.zone_id, prefix))
    return ghosts


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ledger", type=Path, default=DEFAULT_LEDGER_PATH)
    parser.add_argument("--repo-root", type=Path, default=REPO_ROOT)
    parser.add_argument("--warn", action="store_true", help="Print ghosts but exit 0 (CI default until clean).")
    args = parser.parse_args()

    ledger_text = args.ledger.read_text(encoding="utf-8")
    ghosts = lint_zone_paths(ledger_text, args.repo_root)
    if ghosts:
        print("Ghost zone path prefixes (no file or directory under repo root):")
        for zone_id, prefix in ghosts:
            print(f"  - {zone_id}|{prefix}")
    else:
        print("zone path lint: no ghosts")

    if ghosts and not args.warn:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
