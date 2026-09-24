#!/usr/bin/env python3
"""G-QA-02: @release-gate Playwright smokes must stay wired to ui-e2e-live and spec files."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

_CI_REL = ".github/workflows/ci.yml"
_RC_REL = ".github/workflows/rc-release-gate.yml"
_REQUIRED_SPECS = (
    "archlucid-ui/e2e/demo-workspace-a.smoke.spec.ts",
    "archlucid-ui/e2e/demo-workspace-b.smoke.spec.ts",
    "archlucid-ui/e2e/live-api-private-beta-access.spec.ts",
)
_RESTART_MARKER = "Restart API after Enterprise grant"


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.parse_args(argv)

    root = repo_root()
    errors: list[str] = []

    for rel_path in (_CI_REL, _RC_REL):
        path = root / rel_path

        if not path.is_file():
            errors.append(f"missing workflow: {rel_path}")
            continue

        text = path.read_text(encoding="utf-8", errors="replace")

        if "@release-gate" not in text:
            errors.append(f"{rel_path}: missing @release-gate grep/playwright wiring")

        if rel_path == _RC_REL:
            grant = text.find("grant_ci_live_e2e_enterprise_tenant.sh")
            restart = text.find(_RESTART_MARKER)
            ready = text.find("wait-for-api-ready.sh", restart if restart >= 0 else 0)
            if grant < 0 or restart < grant or ready < restart:
                errors.append(f"{rel_path}: Enterprise grant must be followed by API restart and readiness wait")
            else:
                restart_text = text[restart:ready]
                for marker in ("cat \"${RUNNER_TEMP}/", "pkill -TERM -P", "kill \"${API_PID}\"", "nohup dotnet run --no-build"):
                    if marker not in restart_text:
                        errors.append(f"{rel_path}: Enterprise-grant restart is missing {marker}")

    for spec in _REQUIRED_SPECS:
        if not (root / spec).is_file():
            errors.append(f"missing release-gate spec: {spec}")
            continue

        spec_text = (root / spec).read_text(encoding="utf-8", errors="replace")

        if "@release-gate" not in spec_text:
            errors.append(f"{spec}: missing @release-gate tag")

    if errors:
        for error in errors:
            print(error, file=sys.stderr)

        return 1

    print("check_release_gate_playwright_wiring: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
