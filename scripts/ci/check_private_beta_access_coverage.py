#!/usr/bin/env python3
"""Guard the private-beta access-path scenario inventory."""

from __future__ import annotations

import argparse
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

SCENARIO_MARKERS: tuple[tuple[str, tuple[str, ...]], ...] = (
    (
        "archlucid-ui/e2e/live-api-private-beta-access.spec.ts",
        (
            "OIDC callback failure",
            "/auth/session-expired",
            "forged",
            "deep-link round-trip",
            'appRole: "Operator"',
            'appRole: "Reader"',
            'appRole: "Auditor"',
        ),
    ),
    (
        "archlucid-ui/e2e/live-api-private-beta-wave-3.spec.ts",
        (
            "deepLinkTargets",
            "returnUrl",
            "email-OTP",
            "branded-not-found",
        ),
    ),
    (
        "archlucid-ui/e2e/live-api-invite-flow.spec.ts",
        (
            "duplicate pending invite",
            "directory user",
            "revoke",
        ),
    ),
    (
        "archlucid-ui/e2e/live-api-scim-invite-substitute-smoke.spec.ts",
        (
            "issue, list, and revoke",
            "unauthenticated SCIM provisioning request",
            "different tenant",
            "scim-provisioning-settings-page",
            "scim-mutation-success-callout",
        ),
    ),
    (
        "archlucid-ui/e2e/live-api-error-states.spec.ts",
        (
            "branded-not-found",
            "no-results",
            "problem UI",
        ),
    ),
)


def collect_violations(root: Path) -> list[str]:
    violations: list[str] = []

    for relative_path, markers in SCENARIO_MARKERS:
        path = root / relative_path

        if not path.is_file():
            violations.append(f"missing private-beta coverage file: {relative_path}")
            continue

        text = path.read_text(encoding="utf-8", errors="replace")
        missing = [marker for marker in markers if marker not in text]

        if missing:
            violations.append(f"{relative_path} is missing coverage markers: {', '.join(missing)}")

    return violations


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=REPO_ROOT)
    args = parser.parse_args()
    violations = collect_violations(args.root.resolve())

    if violations:
        for violation in violations:
            print(f"ERROR: {violation}")

        return 1

    print("Private-beta access coverage inventory: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
