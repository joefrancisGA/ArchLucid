#!/usr/bin/env python3
"""Validate templates/policy-packs/*/policy-pack.json packManifest metadata (TB-175)."""

from __future__ import annotations

import sys
from pathlib import Path

_SCRIPTS_CI = Path(__file__).resolve().parent

if str(_SCRIPTS_CI) not in sys.path:
    sys.path.insert(0, str(_SCRIPTS_CI))

from policy_pack_manifest_lib import list_vertical_pack_dirs, policy_pack_manifest_violations, policy_packs_root


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def main() -> int:
    violations = policy_pack_manifest_violations(repo_root())

    if violations:
        print("Policy pack manifest validation FAILED:", file=sys.stderr)

        for item in violations:
            print(f"  - {item}", file=sys.stderr)

        return 1

    pack_count = len(list_vertical_pack_dirs(policy_packs_root(repo_root())))
    print(f"OK: validated {pack_count} vertical policy pack manifest(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
