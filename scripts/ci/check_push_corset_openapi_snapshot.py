#!/usr/bin/env python3
"""OpenAPI v1 snapshot must stay on the master/main push corset (not only path-gated PR CI)."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

_PUSH_REL = ".github/workflows/ui-typecheck-on-push.yml"
_JOB_NAME = '.NET: OpenAPI v1 contract snapshot (fail-fast)'
_SCRIPT = "check_openapi_contract_snapshot.sh"
_FILTER_EXCLUSION = "FullyQualifiedName!~OpenApiContractSnapshotTests"
_API_TESTS_CSPROJ = "ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj"
_APPLICATION_TESTS_REF = r"..\ArchLucid.Application.Tests\ArchLucid.Application.Tests.csproj"


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.parse_args(argv)

    root = repo_root()
    push_path = root / _PUSH_REL
    script_path = root / "scripts" / "ci" / _SCRIPT

    errors: list[str] = []

    if not script_path.is_file():
        errors.append(f"missing scripts/ci/{_SCRIPT}")

    if not push_path.is_file():
        errors.append(f"missing {_PUSH_REL}")
    else:
        text = push_path.read_text(encoding="utf-8", errors="replace")

        if "push:" not in text:
            errors.append(f"{_PUSH_REL}: missing on.push trigger")

        if _JOB_NAME not in text:
            errors.append(f"{_PUSH_REL}: missing job name {_JOB_NAME}")

        if _SCRIPT not in text:
            errors.append(f"{_PUSH_REL}: missing {_SCRIPT} invocation")

        if _FILTER_EXCLUSION not in text:
            errors.append(
                f"{_PUSH_REL}: keep OpenAPI snapshot tests out of DOTNET_FAST_CORE_TEST_FILTER "
                f"(dedicated job runs {_SCRIPT})",
            )

        if script_path.is_file() and "ensure_openapi_contract_build.sh" not in script_path.read_text(
            encoding="utf-8",
            errors="replace",
        ):
            errors.append(
                f"scripts/ci/{_SCRIPT}: must compile via ensure_openapi_contract_build.sh "
                "before snapshot compare (regen after a green compile, not against a broken tree)",
            )

    api_tests = root / _API_TESTS_CSPROJ

    if not api_tests.is_file():
        errors.append(f"missing {_API_TESTS_CSPROJ}")
    elif _APPLICATION_TESTS_REF not in api_tests.read_text(encoding="utf-8", errors="replace"):
        errors.append(
            f"{_API_TESTS_CSPROJ}: must ProjectReference Application.Tests "
            "(OpenAPI Release compile includes Application.Tests; CS8122 there fails snapshot)",
        )

    if errors:
        for error in errors:
            print(error, file=sys.stderr)

        return 1

    print("check_push_corset_openapi_snapshot: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
