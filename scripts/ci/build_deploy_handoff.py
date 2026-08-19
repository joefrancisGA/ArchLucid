#!/usr/bin/env python3
"""Build deploy-handoff.json/.md for RC/release evidence bundles."""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

_CI_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(_CI_DIR))

from release_evidence_common import (
    authoritative_release_evidence_environment,
    load_json,
    load_rc_target_environment_matrix,
    repo_root,
)  # noqa: E402

_SCHEMA = "archlucid.deploy-handoff.v1"


def _read_git_sha(root: Path) -> str | None:
    head = root / ".git" / "HEAD"

    if not head.is_file():
        return None

    ref = head.read_text(encoding="utf-8").strip()

    if ref.startswith("ref: "):
        ref_path = root / ".git" / ref[5:].strip()

        if ref_path.is_file():
            return ref_path.read_text(encoding="utf-8").strip()[:40]

        return None

    return ref[:40]


def _read_cli_version(root: Path) -> str | None:
    csproj = root / "ArchLucid.Cli" / "ArchLucid.Cli.csproj"

    if not csproj.is_file():
        return None

    match = re.search(r"<Version>([^<]+)</Version>", csproj.read_text(encoding="utf-8"))

    if match is None:
        return None

    return match.group(1).strip()


def _azure_metadata_from_tf(root: Path) -> dict[str, Any]:
    tf_vars = root / "deploy" / "hosted-prod-terraform" / "variables.tf"
    region = os.environ.get("ARCHLUCID_AZURE_REGION")
    resource_group = os.environ.get("ARCHLUCID_AZURE_RESOURCE_GROUP")
    subscription_id = os.environ.get("ARCHLUCID_AZURE_SUBSCRIPTION_ID")

    if tf_vars.is_file() and region is None:
        text = tf_vars.read_text(encoding="utf-8", errors="replace")
        region_match = re.search(r'variable\s+"location"[\s\S]*?default\s*=\s*"([^"]+)"', text)

        if region_match is not None:
            region = region_match.group(1)

    hosted_profile = "production-like-hosted-pilot"
    appsettings = root / "ArchLucid.Api" / "appsettings.Production.json"
    private_endpoint_posture = "documented-in-terraform"

    if appsettings.is_file():
        text = appsettings.read_text(encoding="utf-8", errors="replace")

        if "private" not in text.lower():
            private_endpoint_posture = "verify-terraform-private-endpoints"

    return {
        "region": region,
        "resourceGroupScope": resource_group,
        "subscriptionScope": subscription_id,
        "environmentProfile": hosted_profile,
        "privateEndpointPosture": private_endpoint_posture,
        "managedIdentityExpected": True,
        "terraformRoot": "deploy/hosted-prod-terraform",
    }


def build_handoff(
    root: Path,
    bundle_dir: Path,
    *,
    environment: str,
    config_profile: str,
    image_tag: str | None,
    strict_rc: bool,
) -> dict[str, Any]:
    readiness = load_json(bundle_dir / "release-readiness-index.json") or {}
    verdict = load_json(bundle_dir / "rc-go-no-go-verdict.json") or {}
    checklist_status = str(readiness.get("rollup") or "UNKNOWN").upper()
    deploy_readiness = str(verdict.get("verdict") or readiness.get("rollup") or "UNKNOWN").upper()

    if deploy_readiness == "PASS" and checklist_status == "WARN":
        deploy_readiness = "WARN"

    if deploy_readiness == "FAIL":
        deploy_readiness = "HOLD"

    azure = _azure_metadata_from_tf(root)
    matrix = load_rc_target_environment_matrix(root)
    authoritative = authoritative_release_evidence_environment(matrix) or {}
    commit_sha = readiness.get("gitCommitSha") or _read_git_sha(root)
    cli_version = readiness.get("archLucidCliVersion") or _read_cli_version(root)
    missing_fields: list[str] = []

    if not commit_sha:
        missing_fields.append("gitCommitSha")

    if not cli_version:
        missing_fields.append("archLucidCliVersion")

    health_ready = bundle_dir / "health-ready.json"

    if strict_rc and not health_ready.is_file():
        missing_fields.append("stagingLiveProbe.health-ready.json")

    if strict_rc and missing_fields:
        deploy_readiness = "HOLD"

    return {
        "schema": _SCHEMA,
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "environmentLabel": environment,
        "appsettingsReportLabel": environment,
        "authoritativeLiveEvidenceEnvironment": authoritative.get("label") or "Staging",
        "authoritativeLiveEvidenceEnvironmentId": authoritative.get("id") or "staging",
        "authoritativeLiveEvidenceRole": authoritative.get("role") or "contract-authoritative",
        "configProfile": config_profile,
        "gitCommitSha": commit_sha,
        "buildVersion": cli_version,
        "imageTags": [image_tag] if image_tag else [],
        "deployReadinessStatus": deploy_readiness,
        "releaseChecklistStatus": checklist_status,
        "rcGoNoGoVerdictRef": "rc-go-no-go-verdict.json",
        "releaseConfidenceRollupRef": "release-confidence-rollup.json",
        "rcTargetEnvironmentMatrixRef": "scripts/ci/data/rc_target_environment_matrix.v1.json",
        "azure": azure,
        "missingCriticalFields": missing_fields,
    }


def render_markdown(payload: dict[str, Any]) -> str:
    azure = payload.get("azure") or {}
    lines = [
        "# Deploy handoff",
        "",
        f"Generated UTC: **{payload['generatedUtc']}**",
        "",
        f"**Deploy readiness:** **{payload.get('deployReadinessStatus')}**",
        "",
        "| Field | Value |",
        "| --- | --- |",
        f"| Appsettings report label | {payload.get('appsettingsReportLabel') or payload.get('environmentLabel')} |",
        f"| Authoritative live evidence environment | **{payload.get('authoritativeLiveEvidenceEnvironment')}** ({payload.get('authoritativeLiveEvidenceRole')}) |",
        f"| Config profile | {payload.get('configProfile')} |",
        f"| Commit SHA | {payload.get('gitCommitSha') or '(missing)'} |",
        f"| Build version | {payload.get('buildVersion') or '(missing)'} |",
        f"| Release checklist | {payload.get('releaseChecklistStatus')} |",
        f"| RC verdict ref | `{payload.get('rcGoNoGoVerdictRef')}` |",
        "",
        "## Azure metadata",
        "",
        f"- Region: {azure.get('region') or '(set ARCHLUCID_AZURE_REGION or attach from tfvars)'}",
        f"- Resource group scope: {azure.get('resourceGroupScope') or '(set ARCHLUCID_AZURE_RESOURCE_GROUP)'}",
        f"- Subscription scope: {azure.get('subscriptionScope') or '(set ARCHLUCID_AZURE_SUBSCRIPTION_ID)'}",
        f"- Environment profile: {azure.get('environmentProfile')}",
        f"- Private endpoint posture: {azure.get('privateEndpointPosture')}",
        f"- Terraform root: `{azure.get('terraformRoot')}`",
        "",
    ]

    missing = payload.get("missingCriticalFields") or []

    if missing:
        lines.append("## Missing critical fields")
        lines.append("")

        for field in missing:
            lines.append(f"- {field}")

        lines.append("")

    return "\n".join(lines)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", type=Path, default=repo_root())
    parser.add_argument("--bundle-dir", type=Path, required=True)
    parser.add_argument("--json-out", type=Path, required=True)
    parser.add_argument("--markdown-out", type=Path, required=True)
    parser.add_argument("--environment", default="Production")
    parser.add_argument("--config-profile", default="production-like-hosted-pilot")
    parser.add_argument("--image-tag", default=None)
    parser.add_argument("--strict-rc", action="store_true")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    payload = build_handoff(
        args.repo_root.resolve(),
        args.bundle_dir.resolve(),
        environment=args.environment,
        config_profile=args.config_profile,
        image_tag=args.image_tag,
        strict_rc=args.strict_rc,
    )

    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.markdown_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    args.markdown_out.write_text(render_markdown(payload), encoding="utf-8")

    if args.strict_rc and payload.get("deployReadinessStatus") == "HOLD":
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
