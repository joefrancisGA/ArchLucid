#!/usr/bin/env python3
"""Beta-readiness guard: AuthBetaReadinessInviteCallout must stay wired on admin invite surfaces."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

_REQUIRED_SURFACES: tuple[tuple[str, str], ...] = (
    (
        "archlucid-ui/src/app/(operator)/administration/users/_sections/SettingsRolesUsersTab.tsx",
        "AuthBetaReadinessInviteCallout",
    ),
    (
        "archlucid-ui/src/app/(operator)/administration/scim-provisioning/_sections/ScimProvisioningSettingsPageClient.tsx",
        "AuthBetaReadinessInviteCallout",
    ),
    (
        "archlucid-ui/src/app/(operator)/administration/identity/sso-wizard/_sections/SsoWizardPageClient.tsx",
        "AuthBetaReadinessInviteCallout",
    ),
    (
        "archlucid-ui/src/app/(operator)/administration/auth-domains/AuthDomainsPageClient.tsx",
        "AuthBetaReadinessInviteCallout",
    ),
)

_VITEST_BAND = "archlucid-ui/src/app/(operator)/administration/_sections/AuthBetaReadinessInviteCalloutSurfaces.test.tsx"


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.parse_args(argv)

    root = repo_root()
    errors: list[str] = []

    for rel_path, marker in _REQUIRED_SURFACES:
        path = root / rel_path

        if not path.is_file():
            errors.append(f"missing surface file: {rel_path}")

            continue

        text = path.read_text(encoding="utf-8", errors="replace")

        if marker not in text:
            errors.append(f"{rel_path}: must import and render {marker}")

    vitest_path = root / _VITEST_BAND

    if not vitest_path.is_file():
        errors.append(f"missing Vitest band: {_VITEST_BAND}")
    elif "auth-beta-readiness-invite-callout" not in vitest_path.read_text(encoding="utf-8", errors="replace"):
        errors.append(f"{_VITEST_BAND}: must assert auth-beta-readiness-invite-callout test id")

    if errors:
        for error in errors:
            print(error, file=sys.stderr)

        return 1

    print("check_auth_beta_readiness_invite_callout_surfaces: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
