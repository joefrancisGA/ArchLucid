#!/usr/bin/env python3
"""Next.js proxy (Edge) must not import client-adjacent help/walkthrough/session modules."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

_PROXY_REL = "archlucid-ui/src/proxy.ts"
_HOST_GATE_REL = "archlucid-ui/src/lib/host-gate.ts"
_BANNED_IMPORTS = (
    "getting-started-help-guide-content",
    "golden-sponsor-package-walkthrough",
    "lib/oidc/session",
    "session-idle-broadcast",
)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _scan(rel_path: str, text: str, errors: list[str]) -> None:
    for banned in _BANNED_IMPORTS:
        if banned in text:
            errors.append(
                f"{rel_path}: must not import {banned} "
                "(Next.js proxy/host-gate Edge bundle; use getting-started-help-guide-route.ts for path constants)",
            )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.parse_args(argv)

    root = repo_root()
    errors: list[str] = []

    for rel_path in (_PROXY_REL, _HOST_GATE_REL):
        path = root / rel_path

        if not path.is_file():
            errors.append(f"missing {rel_path}")
            continue

        _scan(rel_path, path.read_text(encoding="utf-8", errors="replace"), errors)

    host_gate = root / _HOST_GATE_REL

    if host_gate.is_file():
        text = host_gate.read_text(encoding="utf-8", errors="replace")

        if "getting-started-help-guide-route" not in text:
            errors.append(
                f"{_HOST_GATE_REL}: must import LEGACY_GETTING_STARTED_PATH from "
                "getting-started-help-guide-route (lightweight Edge-safe module)",
            )

    if errors:
        for error in errors:
            print(error, file=sys.stderr)

        return 1

    print("check_private_beta_proxy_esm_boundary: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
