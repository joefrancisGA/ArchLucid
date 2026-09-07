#!/usr/bin/env python3
"""AO-50 / Wave 17: Working architecture-object acceptance inventory must stay wired."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

_INVENTORY_REL = "archlucid-ui/src/lib/architecture-object-acceptance-inventory.ts"
_GUARD_TEST_REL = "archlucid-ui/src/lib/architecture-object-acceptance-guard.test.ts"
_ADR_REL = "docs/architecture/adrs/0077-working-architecture-is-the-locator.md"
_INVENTORY_CASE_RE = re.compile(
    r'relativeTestPath:\s*"(?P<path>[^"]+)"[\s\S]*?marker:\s*"(?P<marker>[^"]+)"',
    re.MULTILINE,
)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _parse_inventory_cases(text: str) -> list[tuple[str, str]]:
    return [(match.group("path"), match.group("marker")) for match in _INVENTORY_CASE_RE.finditer(text)]


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.parse_args(argv)

    root = repo_root()
    errors: list[str] = []

    adr_path = root / _ADR_REL

    if not adr_path.is_file():
        errors.append(f"missing ADR 0077: {_ADR_REL}")

    inventory_path = root / _INVENTORY_REL

    if not inventory_path.is_file():
        errors.append(f"missing architecture-object inventory: {_INVENTORY_REL}")
    else:
        inventory_text = inventory_path.read_text(encoding="utf-8", errors="replace")
        cases = _parse_inventory_cases(inventory_text)

        if len(cases) < 10:
            errors.append(
                f"{_INVENTORY_REL}: expected at least 10 acceptance cases, found {len(cases)}",
            )

        ui_src = root / "archlucid-ui" / "src"

        for relative_test_path, marker in cases:
            evidence_path = ui_src / relative_test_path

            if not evidence_path.is_file():
                errors.append(f"AO evidence missing: archlucid-ui/src/{relative_test_path} ({marker})")
                continue

            evidence_text = evidence_path.read_text(encoding="utf-8", errors="replace")

            if marker not in evidence_text:
                errors.append(
                    f"archlucid-ui/src/{relative_test_path}: missing marker {marker!r} from inventory",
                )

    guard_path = root / _GUARD_TEST_REL

    if not guard_path.is_file():
        errors.append(f"missing architecture-object acceptance guard: {_GUARD_TEST_REL}")
    else:
        guard_text = guard_path.read_text(encoding="utf-8", errors="replace")

        for required in (
            "ARCHITECTURE_OBJECT_ACCEPTANCE_CASES",
            "ARCHITECTURE_OBJECT_ADR_0077_RELATIVE_PATH",
            "resolveWorkingStartHref",
            "reviewDetailPath",
        ):
            if required not in guard_text:
                errors.append(f"{_GUARD_TEST_REL}: missing {required!r}")

    if errors:
        for error in errors:
            print(error, file=sys.stderr)

        return 1

    print("check_architecture_object_acceptance_wiring: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
