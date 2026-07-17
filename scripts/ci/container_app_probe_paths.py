#!/usr/bin/env python3
"""Drift guard: Container Apps HTTP probe paths stay aligned with health policy.

API Container Apps readiness intentionally probes ``/health/live`` (fast). Deep
``/health/ready`` is the CD / traffic-safety gate — see
``docs/operations/HEALTH_LIVE_READY_DEPENDENCY_MATRIX.md``.

Self-test: ``python -m unittest discover -s scripts/ci/tests -p "test_container_app_probe_paths.py"``.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

TERRAFORM_RELATIVE = Path("infra/terraform-container-apps/main.tf")

# Ordered expectations: (resource_type_marker, liveness_path, readiness_path)
PROBE_EXPECTATIONS: tuple[tuple[str, str, str], ...] = (
    ("azurerm_container_app.api", "/health/live", "/health/live"),
    ("azurerm_container_app.worker", "/health/live", "/health/ready"),
    ("azurerm_container_app.ui", "/api/health", "/api/health"),
)

DOC_MARKERS = (
    "docs/operations/HEALTH_LIVE_READY_DEPENDENCY_MATRIX.md",
    "API Container Apps readiness uses `/health/live`",
    "CD smoke requires `GET /health/ready`",
)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _extract_resource_block(text: str, resource_name: str) -> str:
    """Return the HCL body for ``resource \"azurerm_container_app\" \"name\"``."""
    pattern = rf'resource\s+"azurerm_container_app"\s+"{re.escape(resource_name.split(".", 1)[1])}"\s*\{{'
    match = re.search(pattern, text)

    if match is None:
        raise ValueError(f"missing resource block for {resource_name}")

    start = match.start()
    depth = 0
    in_block = False

    for index in range(start, len(text)):
        char = text[index]

        if char == "{":
            depth += 1
            in_block = True
            continue

        if char == "}" and in_block:
            depth -= 1

            if depth == 0:
                return text[start : index + 1]

    raise ValueError(f"unclosed resource block for {resource_name}")


def _probe_path(block: str, probe_kind: str) -> str:
    pattern = rf"{probe_kind}_probe\s*\{{(?P<body>.*?)\n\s*\}}"
    match = re.search(pattern, block, flags=re.DOTALL)

    if match is None:
        raise ValueError(f"missing {probe_kind}_probe in block")

    path_match = re.search(r'path\s*=\s*"([^"]+)"', match.group("body"))

    if path_match is None:
        raise ValueError(f"missing path in {probe_kind}_probe")

    return path_match.group(1)


def assert_container_app_probe_paths(terraform_text: str) -> list[str]:
    """Return human-readable assertions that passed; raise ValueError on drift."""
    passed: list[str] = []

    for resource_marker, expected_live, expected_ready in PROBE_EXPECTATIONS:
        block = _extract_resource_block(terraform_text, resource_marker)
        live_path = _probe_path(block, "liveness")
        ready_path = _probe_path(block, "readiness")

        if live_path != expected_live:
            raise ValueError(
                f"{resource_marker} liveness_probe path={live_path!r} "
                f"expected {expected_live!r}"
            )

        if ready_path != expected_ready:
            raise ValueError(
                f"{resource_marker} readiness_probe path={ready_path!r} "
                f"expected {expected_ready!r}"
            )

        passed.append(f"{resource_marker}: live={live_path} ready={ready_path}")

    return passed


def assert_probe_policy_docs_present(repo: Path) -> None:
    matrix = repo / "docs" / "operations" / "HEALTH_LIVE_READY_DEPENDENCY_MATRIX.md"

    if not matrix.is_file():
        raise ValueError(f"missing dependency matrix: {matrix.relative_to(repo).as_posix()}")

    text = matrix.read_text(encoding="utf-8")

    for marker in DOC_MARKERS[1:]:
        if marker not in text:
            raise ValueError(f"dependency matrix missing marker: {marker}")


def main() -> int:
    root = repo_root()
    terraform_path = root / TERRAFORM_RELATIVE

    if not terraform_path.is_file():
        print(f"ERROR: missing {TERRAFORM_RELATIVE.as_posix()}", file=sys.stderr)
        return 1

    try:
        passed = assert_container_app_probe_paths(terraform_path.read_text(encoding="utf-8"))
        assert_probe_policy_docs_present(root)
    except ValueError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    for line in passed:
        print(f"OK {line}")

    print("OK probe policy docs present")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
