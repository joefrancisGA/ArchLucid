#!/usr/bin/env python3
"""Classify PR changed paths into CI lanes (OpenAPI, .NET corset, Terraform).

Used by ci.yml so docs/UI-only PRs skip expensive .NET/OpenAPI/Terraform work while
required check *jobs* still run and report success (soft-skip inside the job).
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

# Align with .github/workflows/openapi-snapshot-refresh.yml + pre-push OpenAPI filter.
OPENAPI_PREFIXES: tuple[str, ...] = (
    "ArchLucid.Api/",
    "ArchLucid.Api.Tests/",
    "ArchLucid.Api.Client/",
    "ArchLucid.Application/",
    "ArchLucid.ArtifactSynthesis/",
    "ArchLucid.ContextIngestion/",
    "ArchLucid.Contracts/",
    "ArchLucid.Core/",
    "ArchLucid.Decisioning/",
    "ArchLucid.KnowledgeGraph/",
    "ArchLucid.Mcp/",
    "ArchLucid.Provenance/",
    "ArchLucid.Retrieval/",
    "ArchLucid.Host.Composition/",
    "ArchLucid.Host.Core/",
    "ArchLucid.Persistence/",
    "ArchLucid.Persistence.Integration/",
    "ArchLucid.Persistence.Runtime/",
    "ArchLucid.AgentRuntime/",
    "ArchLucid.Capabilities.Cost/",
    "schemas/",
)

OPENAPI_EXACT_FILES: frozenset[str] = frozenset(
    {
        "Directory.Build.props",
        "Directory.Build.targets",
        "Directory.Packages.props",
        "global.json",
        "archlucid-ui/src/lib/api-types.generated.ts",
        "archlucid-ui/package.json",
        "archlucid-ui/package-lock.json",
    }
)

# CI / packaging changes must keep full lanes on (self-test the workflow).
FORCE_ALL_PREFIXES: tuple[str, ...] = (
    ".github/workflows/",
    ".github/actions/",
    "scripts/ci/",
)

FORCE_ALL_EXACT_FILES: frozenset[str] = frozenset(
    {
        "ArchLucid.sln",
        "global.json",
        "Directory.Build.props",
        "Directory.Build.targets",
        "Directory.Packages.props",
    }
)

TERRAFORM_PREFIXES: tuple[str, ...] = (
    "infra/",
    "deploy/hosted-prod-terraform/",
)

TERRAFORM_EXACT_FILES: frozenset[str] = frozenset(
    {
        "deploy/archlucid.stack.example.yaml",
    }
)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def normalize_git_path(path: str) -> str:
    return path.strip().replace("\\", "/")


def git_diff_name_only(base_ref: str, root: Path) -> list[str]:
    try:
        completed = subprocess.run(
            ["git", "diff", "--name-only", f"{base_ref}...HEAD"],
            cwd=root,
            capture_output=True,
            text=True,
            check=False,
        )
    except OSError:
        return []

    if completed.returncode != 0:
        return []

    return [normalize_git_path(line) for line in completed.stdout.splitlines() if line.strip()]


def path_matches_force_all(path: str) -> bool:
    normalized = normalize_git_path(path)

    if normalized in FORCE_ALL_EXACT_FILES:
        return True

    for prefix in FORCE_ALL_PREFIXES:
        if normalized.startswith(prefix):
            return True

    return False


def path_matches_openapi(path: str) -> bool:
    normalized = normalize_git_path(path)

    if normalized in OPENAPI_EXACT_FILES:
        return True

    for prefix in OPENAPI_PREFIXES:
        if normalized.startswith(prefix):
            return True

    return False


def path_matches_dotnet(path: str) -> bool:
    normalized = normalize_git_path(path)

    if path_matches_openapi(normalized):
        return True

    if normalized.endswith(".sln") or normalized.endswith(".slnf"):
        return True

    if normalized.startswith("ArchLucid."):
        return True

    if normalized.startswith("templates/archlucid-finding-engine/"):
        return True

    return False


def path_matches_terraform(path: str) -> bool:
    normalized = normalize_git_path(path)

    if normalized in TERRAFORM_EXACT_FILES:
        return True

    for prefix in TERRAFORM_PREFIXES:
        if normalized.startswith(prefix):
            return True

    return False


def classify_paths(changed_paths: list[str]) -> dict[str, object]:
    """Return lane flags. Empty/unknown diffs fail open (run all lanes)."""
    normalized = [normalize_git_path(path) for path in changed_paths if path.strip()]

    if not normalized:
        return {
            "run_openapi": True,
            "run_dotnet": True,
            "run_terraform": True,
            "force_all": True,
            "reason": "empty_or_unknown_diff_fail_open",
            "matched_openapi": [],
            "matched_dotnet": [],
            "matched_terraform": [],
        }

    force_all = any(path_matches_force_all(path) for path in normalized)

    if force_all:
        return {
            "run_openapi": True,
            "run_dotnet": True,
            "run_terraform": True,
            "force_all": True,
            "reason": "ci_or_packaging_paths",
            "matched_openapi": sorted({path for path in normalized if path_matches_openapi(path)}),
            "matched_dotnet": sorted({path for path in normalized if path_matches_dotnet(path)}),
            "matched_terraform": sorted({path for path in normalized if path_matches_terraform(path)}),
        }

    matched_openapi = sorted({path for path in normalized if path_matches_openapi(path)})
    matched_dotnet = sorted({path for path in normalized if path_matches_dotnet(path)})
    matched_terraform = sorted({path for path in normalized if path_matches_terraform(path)})

    return {
        "run_openapi": len(matched_openapi) > 0,
        "run_dotnet": len(matched_dotnet) > 0,
        "run_terraform": len(matched_terraform) > 0,
        "force_all": False,
        "reason": "path_lanes",
        "matched_openapi": matched_openapi,
        "matched_dotnet": matched_dotnet,
        "matched_terraform": matched_terraform,
    }


def detect_ci_path_lanes(
    *,
    base_ref: str,
    event_name: str,
    root: Path | None = None,
) -> dict[str, object]:
    """Classify lanes for the current CI event."""
    root_path = root or repo_root()

    if event_name != "pull_request":
        return {
            "schema": "archlucid.ci-path-lanes.v1",
            "generatedUtc": datetime.now(timezone.utc).isoformat(),
            "baseRef": base_ref,
            "eventName": event_name,
            "run_openapi": True,
            "run_dotnet": True,
            "run_terraform": True,
            "force_all": True,
            "reason": "non_pull_request_full_lanes",
            "changedPaths": [],
            "matched_openapi": [],
            "matched_dotnet": [],
            "matched_terraform": [],
        }

    changed = git_diff_name_only(base_ref, root_path)
    lanes = classify_paths(changed)

    return {
        "schema": "archlucid.ci-path-lanes.v1",
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "baseRef": base_ref,
        "eventName": event_name,
        "changedPaths": changed,
        **lanes,
    }


def write_github_output(payload: dict[str, object], output_path: Path | None = None) -> None:
    path = output_path

    if path is None:
        output_path_env = os.environ.get("GITHUB_OUTPUT", "").strip()
        path = Path(output_path_env) if output_path_env else None

    if path is None:
        return

    if not path.parent.exists():
        return

    def flag(name: str) -> str:
        return "true" if payload.get(name) else "false"

    lines = [
        f"run_openapi={flag('run_openapi')}",
        f"run_dotnet={flag('run_dotnet')}",
        f"run_terraform={flag('run_terraform')}",
        f"force_all={flag('force_all')}",
        f"reason={payload.get('reason', '')}",
    ]
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--base-ref",
        default="origin/master",
        help="Git base ref for pull_request comparison.",
    )
    parser.add_argument(
        "--event-name",
        default=os.environ.get("GITHUB_EVENT_NAME", "pull_request"),
        help="GitHub event name (non-pull_request forces all lanes).",
    )
    parser.add_argument("--json-out", type=Path, default=None)
    parser.add_argument(
        "--write-github-output",
        action="store_true",
        help="Write run_* flags to GITHUB_OUTPUT when present.",
    )
    args = parser.parse_args(argv)

    payload = detect_ci_path_lanes(base_ref=args.base_ref, event_name=args.event_name)

    if args.json_out is not None:
        args.json_out.parent.mkdir(parents=True, exist_ok=True)
        args.json_out.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")

    if args.write_github_output:
        write_github_output(payload)

    print(
        "ci-path-lanes:"
        f" openapi={payload.get('run_openapi')}"
        f" dotnet={payload.get('run_dotnet')}"
        f" terraform={payload.get('run_terraform')}"
        f" reason={payload.get('reason')}"
    )

    return 0


if __name__ == "__main__":
    sys.exit(main())
