#!/usr/bin/env python3
"""Private-beta access path: ci.yml job plus a trunk-push workflow that fires before invites."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

_CI_REL = ".github/workflows/ci.yml"
_PUSH_REL = ".github/workflows/private-beta-access-on-push.yml"
_SPEC = "live-api-private-beta-access.spec.ts"
_CLIENT_REL = "archlucid-ui/e2e/helpers/live-api-client.ts"
_PRIVATE_BETA_TIMEOUT_FN = "liveE2ePrivateBetaAccessPlaywrightTimeoutMs"
_LEGACY_RUN_CYCLE_TIMEOUT_FN = "liveE2eArchitectureRunCyclePlaywrightTimeoutMs"
_MIN_CI_PRIVATE_BETA_PLAYWRIGHT_TIMEOUT_MS = 2_700_000
_JOB_MARKER = "ui-e2e-live-beta-access"
_JOB_NAME = "Operator UI: private-beta access-path (JwtBearer)"
_FULL_REGRESSION_NEED = "dotnet-full-regression-core-complete"
_MIN_TIMEOUT_MINUTES = 45


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _require_jwt_bearer_and_spec(rel_path: str, text: str, errors: list[str]) -> None:
    if _JOB_MARKER not in text:
        errors.append(f"{rel_path}: missing job marker {_JOB_MARKER}")

    if _SPEC not in text:
        errors.append(f"{rel_path}: missing {_SPEC} playwright invocation")

    if (
        "NEXT_PUBLIC_ARCHLUCID_AUTH_MODE: jwt-bearer" not in text
        and "NEXT_PUBLIC_ARCHLUCID_AUTH_MODE=jwt-bearer" not in text
    ):
        errors.append(
            f"{rel_path}: {_JOB_MARKER} must build with NEXT_PUBLIC_ARCHLUCID_AUTH_MODE=jwt-bearer",
        )


def _extract_yaml_job_block(text: str, job_marker: str) -> str | None:
    """Return the indented block for one ci.yml job key (e.g. ui-e2e-live-beta-access)."""
    match = re.search(rf"^  {re.escape(job_marker)}:\s*$", text, re.MULTILINE)

    if match is None:
        return None

    start = match.start()
    next_job = re.search(r"^  [a-zA-Z0-9_-]+:\s*$", text[match.end() :], re.MULTILINE)

    if next_job is None:
        return text[start:]

    return text[start : match.end() + next_job.start()]


def _require_live_e2e_build(rel_path: str, text: str, errors: list[str]) -> None:
    job_text = text if rel_path == _PUSH_REL else _extract_yaml_job_block(text, _JOB_MARKER)

    if job_text is None:
        errors.append(f"{rel_path}: missing job marker {_JOB_MARKER}")

        return

    if "npm run build:live-e2e" not in job_text:
        errors.append(
            f"{rel_path}: {_JOB_NAME} must use npm run build:live-e2e "
            "(skip build:docs-pdf; private-beta smoke does not need static help PDFs)",
        )


def _require_private_beta_playwright_timeout_wiring(spec_text: str, client_text: str, errors: list[str]) -> None:
    if _PRIVATE_BETA_TIMEOUT_FN not in spec_text:
        errors.append(
            f"archlucid-ui/e2e/{_SPEC}: must import and use {_PRIVATE_BETA_TIMEOUT_FN} "
            "for per-test Playwright timeout (120m job / 45m per-test CI budget)",
        )

    if f"test.setTimeout({_PRIVATE_BETA_TIMEOUT_FN}())" not in spec_text:
        errors.append(
            f"archlucid-ui/e2e/{_SPEC}: each invite-wave test must call "
            f"test.setTimeout({_PRIVATE_BETA_TIMEOUT_FN}())",
        )

    if _LEGACY_RUN_CYCLE_TIMEOUT_FN in spec_text:
        errors.append(
            f"archlucid-ui/e2e/{_SPEC}: must not use {_LEGACY_RUN_CYCLE_TIMEOUT_FN} "
            f"(10m CI budget is insufficient for private-beta create-run); use {_PRIVATE_BETA_TIMEOUT_FN}",
        )

    if _PRIVATE_BETA_TIMEOUT_FN not in client_text:
        errors.append(f"{_CLIENT_REL}: missing {_PRIVATE_BETA_TIMEOUT_FN} export")

        return

    match = re.search(
        rf"export function {_PRIVATE_BETA_TIMEOUT_FN}\(\).*?if \(process\.env\.CI\) \{{\s*return ([\d_]+);",
        client_text,
        re.DOTALL,
    )

    if match is None:
        errors.append(
            f"{_CLIENT_REL}: {_PRIVATE_BETA_TIMEOUT_FN} must return a numeric CI timeout "
            f">= {_MIN_CI_PRIVATE_BETA_PLAYWRIGHT_TIMEOUT_MS}",
        )

        return

    ci_timeout_ms = int(match.group(1).replace("_", ""))

    if ci_timeout_ms < _MIN_CI_PRIVATE_BETA_PLAYWRIGHT_TIMEOUT_MS:
        errors.append(
            f"{_CLIENT_REL}: {_PRIVATE_BETA_TIMEOUT_FN} CI timeout {ci_timeout_ms}ms is below "
            f"{_MIN_CI_PRIVATE_BETA_PLAYWRIGHT_TIMEOUT_MS}ms (private-beta job timeout-minutes=120)",
        )


def _require_private_beta_job_timeout(rel_path: str, text: str, errors: list[str]) -> None:
    job_text = text if rel_path == _PUSH_REL else _extract_yaml_job_block(text, _JOB_MARKER)

    if job_text is None:
        errors.append(f"{rel_path}: missing job marker {_JOB_MARKER}")

        return

    match = re.search(r"timeout-minutes:\s*(\d+)", job_text)

    if match is None:
        errors.append(f"{rel_path}: missing timeout-minutes for {_JOB_NAME}")

        return

    timeout_minutes = int(match.group(1))

    if timeout_minutes < _MIN_TIMEOUT_MINUTES:
        errors.append(
            f"{rel_path}: {_JOB_NAME} timeout-minutes={timeout_minutes} is below {_MIN_TIMEOUT_MINUTES}; "
            "Playwright create→execute→commit smoke exceeds 30m on trunk push",
        )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.parse_args(argv)

    root = repo_root()
    ci_path = root / _CI_REL
    push_path = root / _PUSH_REL
    spec_path = root / "archlucid-ui" / "e2e" / _SPEC
    client_path = root / _CLIENT_REL

    errors: list[str] = []

    if not spec_path.is_file():
        errors.append(f"missing private-beta access spec: archlucid-ui/e2e/{_SPEC}")
    elif not client_path.is_file():
        errors.append(f"missing live API client helper: {_CLIENT_REL}")
    else:
        spec_text = spec_path.read_text(encoding="utf-8", errors="replace")
        client_text = client_path.read_text(encoding="utf-8", errors="replace")
        _require_private_beta_playwright_timeout_wiring(spec_text, client_text, errors)

    if not ci_path.is_file():
        errors.append(f"missing {_CI_REL}")
    else:
        ci_text = ci_path.read_text(encoding="utf-8", errors="replace")
        _require_jwt_bearer_and_spec(_CI_REL, ci_text, errors)
        _require_private_beta_job_timeout(_CI_REL, ci_text, errors)
        _require_live_e2e_build(_CI_REL, ci_text, errors)

    if not push_path.is_file():
        errors.append(f"missing {_PUSH_REL} (trunk push must run private-beta Playwright before invites)")
    else:
        text = push_path.read_text(encoding="utf-8", errors="replace")

        if "push:" not in text:
            errors.append(f"{_PUSH_REL}: missing on.push trigger")

        if "branches: [main, master]" not in text:
            errors.append(f"{_PUSH_REL}: missing push branches main/master")

        if _JOB_NAME not in text:
            errors.append(f"{_PUSH_REL}: missing job name {_JOB_NAME}")

        _require_jwt_bearer_and_spec(_PUSH_REL, text, errors)
        _require_private_beta_job_timeout(_PUSH_REL, text, errors)
        _require_live_e2e_build(_PUSH_REL, text, errors)

        if "cancel-in-progress: false" not in text:
            errors.append(
                f"{_PUSH_REL}: must set cancel-in-progress: false so trunk merge trains are not evicted mid-smoke",
            )

        if _FULL_REGRESSION_NEED in text:
            errors.append(
                f"{_PUSH_REL}: must not wait on {_FULL_REGRESSION_NEED} "
                "(invite-wave path must start without full ci.yml regression)",
            )

    if errors:
        for error in errors:
            print(error, file=sys.stderr)

        return 1

    print("check_live_api_private_beta_access_ci_wiring: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
