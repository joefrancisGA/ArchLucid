#!/usr/bin/env python3
"""Private-beta operator kit must not imply CPA SOC 2, published pen tests, or self-service pay."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

_DOCS: tuple[str, ...] = (
    "docs/go-to-market/PRIVATE_BETA_INVITEE_WELCOME_KIT.md",
    "docs/runbooks/PRIVATE_BETA_KILL_SWITCH_AND_SPEND_INVENTORY.md",
    "docs/go-to-market/FOUNDER_30_MIN_PACK_AB_DEMO_SCRIPT.md",
    "docs/runbooks/PRIVATE_BETA_INCIDENT_COMMS_15MIN.md",
    "docs/runbooks/PRIVATE_BETA_FROZEN_BRANCH.md",
)

_PROHIBITED: tuple[tuple[re.Pattern[str], str], ...] = (
    (re.compile(r"\bsoc 2 certified\b", re.I), "SOC 2 certified"),
    (re.compile(r"\bcpa-issued soc 2\b", re.I), "CPA-issued SOC 2"),
    (re.compile(r"\bpublished third-party pen test\b", re.I), "published third-party pen test"),
    (re.compile(r"\bsign up and pay\b", re.I), "sign up and pay"),
    (re.compile(r"\blive stripe keys\b", re.I), "live Stripe keys"),
)

_CAVEAT_MARKERS: tuple[str, ...] = (
    "not ",
    "no ",
    "do not",
    "does not",
    "never ",
    "self-assessment",
    "unless",
    "must not",
)

_FOUNDER_DEMO_REL = "docs/go-to-market/FOUNDER_30_MIN_PACK_AB_DEMO_SCRIPT.md"
_FOUNDER_REQUIRED: tuple[str, ...] = (
    "CPA-issued SOC 2",
    "published third-party pen test",
    "Expired or revoked invite",
    "Dead review deep link",
    "correlationId",
)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def line_has_caveat(line: str) -> bool:
    lowered = line.lower()
    return any(marker in lowered for marker in _CAVEAT_MARKERS)


def scan_docs(root: Path) -> list[str]:
    violations: list[str] = []

    for rel in _DOCS:
        path = root / rel

        if not path.is_file():
            violations.append(f"missing {rel}")
            continue

        for index, line in enumerate(path.read_text(encoding="utf-8", errors="replace").splitlines(), start=1):
            if line_has_caveat(line):
                continue

            for pattern, label in _PROHIBITED:
                if pattern.search(line):
                    violations.append(f"{rel}:{index}: overclaim {label!r}")

    return violations


def require_founder_demo_recovery(root: Path) -> list[str]:
    path = root / _FOUNDER_DEMO_REL
    errors: list[str] = []

    if not path.is_file():
        return [f"missing {_FOUNDER_DEMO_REL}"]

    text = path.read_text(encoding="utf-8", errors="replace")

    for marker in _FOUNDER_REQUIRED:
        if marker not in text:
            errors.append(
                f"{_FOUNDER_DEMO_REL}: must keep founder recovery/honesty marker {marker!r}",
            )

    return errors


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.parse_args(argv)

    root = repo_root()
    violations = scan_docs(root)
    violations.extend(require_founder_demo_recovery(root))

    if violations:
        print("check_private_beta_claim_boundary: FAIL", file=sys.stderr)

        for item in violations:
            print(item, file=sys.stderr)

        return 1

    print("check_private_beta_claim_boundary: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
