#!/usr/bin/env python3
"""Fail CI when integration tests call deprecated run-lifecycle write routes (ADR 0021 / 0042).

Integration and API lifecycle tests must exercise the canonical authority pipeline
(POST /v1/architecture/request|execute|commit). Deprecated aliases (/v1/requests,
/v1/runs/{runId}/submit, /v1/runs/{runId}/manifest/finalize) remain routable for
backward compatibility but must not be used in integration coverage.

Allow-listed files may reference alias templates when explicitly testing deprecation
headers or route registration — not when driving run lifecycle in integration scenarios.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]

# Basenames that intentionally reference deprecated alias templates.
ALLOWLIST_BASENAMES = frozenset(
    {
        "RunWriteLifecycleRoutesTests.cs",
        "RunAliasDeprecationMiddlewareTests.cs",
        "CanonicalRunWriteSurfaceArchitectureTests.cs",
        "OpenApiContractInvariantsTests.cs",
        "MutatingIdempotencyContractArchitectureTests.cs",
        "ApplicationProblemMapperTests.cs",
        "AuditEventTypes.cs",
        "ArchLucidApiClient.g.cs",
        "RunsController.cs",
        "RunWriteLifecycleRoutes.cs",
        "ArchLucidInstrumentation.cs",
    }
)

# Deprecated run-lifecycle write paths (draft submit is a different surface).
FORBIDDEN_PATTERNS: tuple[tuple[re.Pattern[str], str], ...] = (
    (re.compile(r'["\']/v1/requests["\']'), "POST /v1/requests (use /v1/architecture/request)"),
    (
        re.compile(r'runs/\{runId\}/submit|runs/\{[^}]+\}/submit'),
        "POST /v1/runs/{runId}/submit (use /v1/architecture/run/{runId}/execute)",
    ),
    (
        re.compile(r'manifest/finalize'),
        "POST .../manifest/finalize (use /v1/architecture/run/{runId}/commit)",
    ),
)


def _is_integration_test_file(path: Path) -> bool:
    if path.suffix.lower() != ".cs":
        return False

    name = path.name
    if "Integration" not in name:
        return False

    parts = {part.lower() for part in path.parts}
    return any(part.endswith(".tests") for part in parts)


def scan_integration_tests() -> list[str]:
    violations: list[str] = []

    for path in REPO_ROOT.rglob("*.cs"):
        if not _is_integration_test_file(path):
            continue

        if path.name in ALLOWLIST_BASENAMES:
            continue

        try:
            text = path.read_text(encoding="utf-8")
        except OSError as exc:
            violations.append(f"{path}: unreadable ({exc})")
            continue

        for pattern, message in FORBIDDEN_PATTERNS:
            for match in pattern.finditer(text):
                line = text.count("\n", 0, match.start()) + 1
                violations.append(f"{path.relative_to(REPO_ROOT)}:{line}: {message}")

    return violations


def main() -> int:
    violations = scan_integration_tests()

    if violations:
        print(
            "Integration tests must use canonical run-lifecycle write routes only:\n- "
            + "\n- ".join(violations),
            file=sys.stderr,
        )
        print(
            "Add the file to ALLOWLIST_BASENAMES only when testing alias registration or deprecation headers.",
            file=sys.stderr,
        )
        return 1

    print("Integration test canonical run-write guard OK.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
