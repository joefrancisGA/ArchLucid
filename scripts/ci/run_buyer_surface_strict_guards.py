#!/usr/bin/env python3
"""Run buyer-facing claim guards in advisory or strict mode based on diff scope."""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

from detect_buyer_surface_changes import detect_buyer_surface_changes

_CI_DIR = Path(__file__).resolve().parent


@dataclass(frozen=True)
class GuardCommand:
    label: str
    argv: tuple[str, ...]
    advisory_flag: str | None = None


GUARDS: tuple[GuardCommand, ...] = (
    GuardCommand(
        "buyer claim drift",
        ("python", "scripts/ci/check_buyer_claim_drift.py"),
        "--advisory",
    ),
    GuardCommand(
        "claim/evidence consistency",
        ("python", "scripts/ci/check_claim_evidence_consistency.py"),
        None,
    ),
    GuardCommand(
        "commercial overclaim guard",
        ("python", "scripts/ci/check_commercial_overclaim_guard.py"),
        None,
    ),
    GuardCommand(
        "procurement claim coherence",
        ("python", "scripts/ci/check_procurement_claim_coherence.py"),
        None,
    ),
    GuardCommand(
        "bakeoff 15-min honesty",
        ("python", "scripts/ci/check_bakeoff_15min_honesty.py"),
        None,
    ),
    GuardCommand(
        "weekly buyer-claim drift inventory",
        ("python", "scripts/ci/check_weekly_buyer_claim_drift_inventory.py"),
        None,
    ),
    GuardCommand(
        "weekly buyer-claim drift honesty",
        ("python", "scripts/ci/check_weekly_buyer_claim_drift_honesty.py"),
        None,
    ),
    GuardCommand(
        "AOAI retirement repro honesty",
        ("python", "scripts/ci/check_aoai_retirement_repro_honesty.py"),
        None,
    ),
    GuardCommand(
        "live vs nightly tripwire honesty",
        ("python", "scripts/ci/check_live_vs_nightly_tripwire_honesty.py"),
        None,
    ),
    GuardCommand(
        "solo-ops MVO honesty",
        ("python", "scripts/ci/check_solo_ops_mvo_honesty.py"),
        None,
    ),
    GuardCommand(
        "outbox exactly-once honesty",
        ("python", "scripts/ci/check_outbox_exactly_once_honesty.py"),
        None,
    ),
    GuardCommand(
        "manifest schema evolution honesty",
        ("python", "scripts/ci/check_manifest_schema_evolution_honesty.py"),
        None,
    ),
    GuardCommand(
        "concurrent execute/commit honesty",
        ("python", "scripts/ci/check_concurrent_execute_commit_honesty.py"),
        None,
    ),
    GuardCommand(
        "buyer first-30-minutes sync",
        ("python", "scripts/ci/assert_buyer_first_30_minutes_in_sync.py"),
        None,
    ),
    GuardCommand(
        "sponsor evidence label consistency",
        ("python", "scripts/ci/check_sponsor_evidence_label_consistency.py"),
        None,
    ),
    GuardCommand(
        "proof-language superlatives",
        ("python", "scripts/ci/check_proof_language_superlatives.py"),
        "--advisory",
    ),
)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def resolve_strict_mode(*, base_ref: str, force_strict: bool, force_advisory: bool) -> tuple[bool, list[str]]:
    if force_advisory:
        return False, []

    if force_strict:
        return True, []

    env_strict = os.environ.get("ARCHLUCID_BUYER_SURFACE_STRICT", "").strip().lower()

    if env_strict in {"1", "true", "yes"}:
        return True, []

    ref = os.environ.get("GITHUB_REF", "")

    if ref.startswith("refs/heads/release/") or "/tags/v" in ref and "-rc" in ref:
        return True, []

    payload = detect_buyer_surface_changes(base_ref, repo_root())
    changed_paths = payload.get("changedPaths", [])

    if not isinstance(changed_paths, list):
        return False, []

    return bool(payload.get("buyerSurfaceChanged")), [str(path) for path in changed_paths]


def run_guard(root: Path, guard: GuardCommand, *, strict: bool) -> tuple[int, str]:
    argv = list(guard.argv)

    if not strict and guard.advisory_flag is not None:
        argv.append(guard.advisory_flag)

    completed = subprocess.run(
        argv,
        cwd=root,
        capture_output=True,
        text=True,
        check=False,
    )
    output = (completed.stdout or "") + (completed.stderr or "")

    return completed.returncode, output.strip()


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-ref", default="origin/main")
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Force strict mode regardless of buyer-surface diff.",
    )
    parser.add_argument(
        "--advisory",
        action="store_true",
        help="Force advisory mode (never fail).",
    )
    args = parser.parse_args(argv)

    root = repo_root()
    strict, changed_paths = resolve_strict_mode(
        base_ref=args.base_ref,
        force_strict=args.strict,
        force_advisory=args.advisory,
    )
    mode_label = "strict" if strict else "advisory"

    print(f"buyer-surface guards: mode={mode_label} base_ref={args.base_ref}")

    if changed_paths:
        print(f"buyer-surface guards: {len(changed_paths)} changed path(s) triggered strict evaluation")

        for path in changed_paths:
            print(f"  - {path}")
    elif strict:
        print("buyer-surface guards: strict via release branch/tag or ARCHLUCID_BUYER_SURFACE_STRICT")
    else:
        print("buyer-surface guards: no buyer-surface diff — failures are advisory only")

    failures: list[str] = []

    for guard in GUARDS:
        exit_code, output = run_guard(root, guard, strict=strict)

        if exit_code == 0:
            print(f"  PASS {guard.label}")
            continue

        failures.append(guard.label)
        print(f"  FAIL {guard.label} (exit {exit_code})", file=sys.stderr)

        if output:
            print(output, file=sys.stderr)

    if failures and strict:
        print(
            f"buyer-surface guards: {len(failures)} blocking failure(s) in strict mode",
            file=sys.stderr,
        )
        return 1

    if failures:
        print(
            f"buyer-surface guards: {len(failures)} advisory failure(s) — merge not blocked",
            file=sys.stderr,
        )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
