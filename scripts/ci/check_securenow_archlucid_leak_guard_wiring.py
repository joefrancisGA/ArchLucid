#!/usr/bin/env python3
"""SN-07: SecureNow consumer-brand ArchLucid leak ratchet must stay wired in CI Vitest."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

_SCANNER_REL = "archlucid-ui/src/lib/product-line/securenow-archlucid-leak-scanner.ts"
_SCANNER_TEST_REL = "archlucid-ui/src/lib/product-line/securenow-archlucid-leak-scanner.test.ts"
_DRIFT_GUARD_REL = "archlucid-ui/scripts/securenow-archlucid-leak-drift-guard.test.ts"
_ALLOWLIST_REL = "scripts/ci/data/securenow-archlucid-allowlist.json"
_SHARDS_REL = "scripts/ci/ui_unit_vitest_shards.json"


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _surface_shard_includes_scripts(root: Path, errors: list[str]) -> None:
    shards_path = root / _SHARDS_REL

    if not shards_path.is_file():
        errors.append(f"missing Vitest shard manifest: {_SHARDS_REL}")
        return

    manifest = json.loads(shards_path.read_text(encoding="utf-8"))
    shards = manifest.get("shards", [])

    surface_shard = next((shard for shard in shards if shard.get("id") == "surface"), None)

    if surface_shard is None:
        errors.append(f"{_SHARDS_REL}: missing surface shard")
        return

    paths = surface_shard.get("paths", [])

    if "scripts" not in paths:
        errors.append(
            f"{_SHARDS_REL}: surface shard must include scripts/ so SN-07 drift guard runs in CI",
        )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.parse_args(argv)

    root = repo_root()
    errors: list[str] = []

    required_files = (
        _SCANNER_REL,
        _SCANNER_TEST_REL,
        _DRIFT_GUARD_REL,
        _ALLOWLIST_REL,
    )

    for rel_path in required_files:
        path = root / rel_path

        if not path.is_file():
            errors.append(f"missing SecureNow leak guard artifact: {rel_path}")

    allowlist_path = root / _ALLOWLIST_REL

    if allowlist_path.is_file():
        allowlist = json.loads(allowlist_path.read_text(encoding="utf-8"))

        for key in ("strictPaths", "fileExclusions", "linePatterns"):
            if key not in allowlist:
                errors.append(f"{_ALLOWLIST_REL}: missing {key!r}")

    drift_path = root / _DRIFT_GUARD_REL

    if drift_path.is_file():
        drift_text = drift_path.read_text(encoding="utf-8", errors="replace")

        for required in (
            "scanSecureNowArchLucidLeaks",
            "loadSecureNowArchLucidLeakAllowlist",
            "SN-07",
        ):
            if required not in drift_text:
                errors.append(f"{_DRIFT_GUARD_REL}: missing {required!r}")

    _surface_shard_includes_scripts(root, errors)

    if errors:
        for error in errors:
            print(error, file=sys.stderr)

        return 1

    print("check_securenow_archlucid_leak_guard_wiring: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
