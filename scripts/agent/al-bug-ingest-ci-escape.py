#!/usr/bin/env python3
"""Propose CI escape-log lines from a red default-branch job (ABQ-30).

Honest v1: dry-run / artifact only. Do not invent a CI git-push bot.
Do not create PD-### rows. source is always ``ci``.

When production paths cannot be recovered, **skip** the append (do not write
``unzoned``) so the picker is not spammed. Pass ``--paths`` or a job-map entry
with at least one path to emit a line.

Multiple covering zones yield one JSONL line per zone (not a blended zone).
Same ``ref`` + ``zoneId`` on the same UTC day is idempotent (no second line).
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

_AGENT_DIR = Path(__file__).resolve().parent
if str(_AGENT_DIR) not in sys.path:
    sys.path.insert(0, str(_AGENT_DIR))

from al_bug_escape_log import (  # noqa: E402
    DEFAULT_ESCAPE_LOG_PATH,
    compute_hunted_in_prior_days,
    parse_iso_utc,
    read_escape_log,
    read_run_log_entries,
)
from al_bug_ledger import DEFAULT_LEDGER_PATH, map_paths_to_zone_ids  # noqa: E402

DEFAULT_RUN_LOG = Path(__file__).resolve().parents[2] / "docs/library/AL_BUG_HUNT_RUN_LOG.jsonl"
DEFAULT_JOB_MAP = Path(__file__).resolve().parent / "al-bug-ci-test-to-paths.json"


def load_job_map(path: Path | None) -> dict[str, list[str]]:
    if path is None or not path.is_file():
        return {}
    payload = json.loads(path.read_text(encoding="utf-8"))
    mapped: dict[str, list[str]] = {}
    for key, value in payload.items():
        if key.startswith("_"):
            continue
        if isinstance(value, list):
            mapped[key] = [str(item) for item in value]
    return mapped


def resolve_paths(explicit_paths: list[str], check_names: list[str], job_map: dict[str, list[str]]) -> list[str]:
    if explicit_paths:
        return list(explicit_paths)
    resolved: list[str] = []
    for name in check_names:
        resolved.extend(job_map.get(name, []))
    return resolved


def build_escape_payloads(
    *,
    ledger_text: str,
    paths: list[str],
    check_name: str,
    run_url: str,
    hunt_entries: list[dict],
    now_utc: datetime,
) -> list[dict]:
    if not paths:
        return []
    zone_ids = map_paths_to_zone_ids(ledger_text, paths)
    if not zone_ids:
        return []
    ref = f"{run_url} {check_name}".strip()
    lines: list[dict] = []
    for zone_id in zone_ids:
        zone_paths = [p for p in paths if zone_id in map_paths_to_zone_ids(ledger_text, [p])]
        hunted = compute_hunted_in_prior_days(hunt_entries, zone_id, now_utc)
        lines.append(
            {
                "at": now_utc.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "source": "ci",
                "zoneId": zone_id,
                "paths": zone_paths or paths,
                "ref": ref,
                "huntedInPriorDays": hunted,
            }
        )
    return lines


def is_duplicate(existing_ref: str, existing_zone: str, existing_at: str, ref: str, zone_id: str, now_utc: datetime) -> bool:
    if existing_ref != ref or existing_zone != zone_id:
        return False
    try:
        existing = parse_iso_utc(existing_at)
    except ValueError:
        return False
    return existing.date() == now_utc.date()


def append_or_print(
    payloads: list[dict],
    escape_path: Path,
    *,
    dry_run: bool,
) -> list[dict]:
    existing = read_escape_log(escape_path) if escape_path.is_file() else []
    written: list[dict] = []
    for payload in payloads:
        duplicate = False
        for entry in existing:
            if is_duplicate(entry.ref, entry.zone_id, entry.at, payload["ref"], payload["zoneId"], parse_iso_utc(payload["at"])):
                duplicate = True
                break
        if duplicate:
            continue
        written.append(payload)
        existing_ids = {(e.ref, e.zone_id, parse_iso_utc(e.at).date()) for e in existing}
        existing_ids.add((payload["ref"], payload["zoneId"], parse_iso_utc(payload["at"]).date()))
    if dry_run:
        return written
    if not written:
        return written
    escape_path.parent.mkdir(parents=True, exist_ok=True)
    with escape_path.open("a", encoding="utf-8") as handle:
        for payload in written:
            handle.write(json.dumps(payload, separators=(",", ":")) + "\n")
    return written


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check-name", action="append", dest="check_names", default=[])
    parser.add_argument("--run-url", required=True)
    parser.add_argument("--paths", action="append", default=[])
    parser.add_argument("--job-map", type=Path, default=DEFAULT_JOB_MAP)
    parser.add_argument("--ledger", type=Path, default=DEFAULT_LEDGER_PATH)
    parser.add_argument("--escape-log", type=Path, default=DEFAULT_ESCAPE_LOG_PATH)
    parser.add_argument("--run-log", type=Path, default=DEFAULT_RUN_LOG)
    parser.add_argument("--output", type=Path, help="Write dry-run JSONL to this path (artifact).")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--at-utc", help="ISO-8601 UTC timestamp for tests.")
    args = parser.parse_args(argv)

    check_names = args.check_names or ["CI"]
    if args.at_utc:
        now_utc = parse_iso_utc(args.at_utc)
    else:
        now_utc = datetime.now(timezone.utc)

    job_map = load_job_map(args.job_map if args.job_map.is_file() else None)
    paths = resolve_paths(args.paths, check_names, job_map)
    if not paths:
        print("skip: no production paths recovered (unknown job is not written as unzoned)", file=sys.stderr)
        return 0

    ledger_text = args.ledger.read_text(encoding="utf-8")
    hunt_entries = read_run_log_entries(args.run_log)
    payloads = build_escape_payloads(
        ledger_text=ledger_text,
        paths=paths,
        check_name=check_names[0],
        run_url=args.run_url,
        hunt_entries=hunt_entries,
        now_utc=now_utc,
    )
    if not payloads:
        print("skip: paths did not match a hunt zone (not writing unzoned)", file=sys.stderr)
        return 0

    written = append_or_print(payloads, args.escape_log, dry_run=args.dry_run)
    text = "".join(json.dumps(item, separators=(",", ":")) + "\n" for item in written)
    if args.output is not None:
        args.output.write_text(text, encoding="utf-8")
    if args.dry_run or written:
        sys.stdout.write(text)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
