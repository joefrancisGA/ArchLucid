#!/usr/bin/env python3
"""Ensure SecureNow procurement trust copy matches operator footer drawer labels."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
COPY = ROOT / "archlucid-ui/src/lib/product-line/securenow-procurement-trust-copy.ts"
DRAWER = ROOT / "archlucid-ui/src/components/product-line/SecureNowProcurementTrustFooterDrawer.tsx"


def main() -> int:
    errors: list[str] = []
    copy = COPY.read_text(encoding="utf-8") if COPY.is_file() else ""
    drawer = DRAWER.read_text(encoding="utf-8") if DRAWER.is_file() else ""
    if not copy:
        errors.append(f"missing {COPY}")
    if not drawer:
        errors.append(f"missing {DRAWER}")
    tokens = (
        "SECURENOW_PROCUREMENT_TRUST_HEADING",
        "SECURENOW_PROCUREMENT_TRUST_LEAD",
        "SECURENOW_PROCUREMENT_TRUST_CENTER_LABEL",
        "SECURENOW_PROCUREMENT_ASSURANCE_LABEL",
    )
    for token in tokens:
        if token not in drawer:
            errors.append(f"{DRAWER.name}: missing {token!r}")
    if copy and drawer:
        for marker in ('data-testid="securenow-procurement-trust-footer-drawer"', "Open Trust Center", "Assurance status"):
            if marker not in drawer:
                errors.append(f"{DRAWER.name}: missing mounted marker {marker!r}")
    for error in errors:
        print(error)
    if errors:
        return 1
    print("SecureNow procurement/packaging copy sync: PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
