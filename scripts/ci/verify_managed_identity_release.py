#!/usr/bin/env python3
"""Verify managed-identity posture for hosted Azure release profiles."""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

_SCHEMA = "archlucid.managed-identity-verification.v1"


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _read_appsettings(root: Path) -> str:
    parts: list[str] = []

    for name in ("appsettings.json", "appsettings.Production.json", "appsettings.Advanced.json"):
        path = root / "ArchLucid.Api" / name

        if path.is_file():
            parts.append(path.read_text(encoding="utf-8", errors="replace"))

    return "\n".join(parts)


def _terraform_has_managed_identity(root: Path) -> bool:
    tf_root = root / "deploy" / "hosted-prod-terraform"

    if not tf_root.is_dir():
        return False

    for path in tf_root.rglob("*.tf"):
        text = path.read_text(encoding="utf-8", errors="replace")

        if "workload_identity_principal_id" in text or "managed identity" in text.lower():
            return True

    return False


def evaluate_managed_identity(root: Path, *, hosted_profile: bool) -> tuple[str, list[dict[str, str]]]:
    rows: list[dict[str, str]] = []

    if not hosted_profile:
        rows.append(
            {
                "check": "Profile scope",
                "result": "PASS",
                "detail": "Non-hosted profile — managed identity verification labeled N/A",
            }
        )
        return "PASS", rows

    config_text = _read_appsettings(root)
    sample = root / "ArchLucid.Api" / "appsettings.KeyVault.sample.json"
    sample_has_mi = False

    if sample.is_file():
        sample_has_mi = "ManagedIdentity" in sample.read_text(encoding="utf-8", errors="replace")

    rows.append(
        {
            "check": "Key Vault sample AuthenticationMode",
            "result": "PASS" if sample_has_mi else "WARN",
            "detail": "ManagedIdentity documented in appsettings.KeyVault.sample.json"
            if sample_has_mi
            else "Sample missing ManagedIdentity guidance",
        }
    )

    tf_ok = _terraform_has_managed_identity(root)
    rows.append(
        {
            "check": "Hosted Terraform workload identity wiring",
            "result": "PASS" if tf_ok else "HOLD",
            "detail": "deploy/hosted-prod-terraform references workload identity"
            if tf_ok
            else "No workload identity signals in hosted Terraform root",
        }
    )

    secret_fallback = bool(re.search(r'"Password"\s*:\s*"[^"]+"', config_text))
    rows.append(
        {
            "check": "Production appsettings secret literals",
            "result": "WARN" if secret_fallback else "PASS",
            "detail": "Password literals detected in appsettings — prefer managed identity + Key Vault"
            if secret_fallback
            else "No inline password literals in sampled appsettings",
        }
    )

    if any(row["result"] == "HOLD" for row in rows):
        return "HOLD", rows

    if any(row["result"] == "WARN" for row in rows):
        return "WARN", rows

    return "PASS", rows


def build_payload(root: Path, *, hosted_profile: bool) -> dict[str, Any]:
    disposition, rows = evaluate_managed_identity(root, hosted_profile=hosted_profile)

    return {
        "schema": _SCHEMA,
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "disposition": disposition,
        "hostedProfile": hosted_profile,
        "findings": rows,
    }


def render_markdown(payload: dict[str, Any]) -> str:
    lines = [
        "# Managed identity verification",
        "",
        f"Generated UTC: **{payload['generatedUtc']}**",
        "",
        f"**Disposition:** **{payload['disposition']}**",
        "",
        "| Check | Result | Detail |",
        "| --- | --- | --- |",
    ]

    for row in payload.get("findings") or []:
        detail = str(row.get("detail") or "").replace("|", "/")
        lines.append(f"| {row.get('check')} | {row.get('result')} | {detail} |")

    lines.append("")
    return "\n".join(lines)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", type=Path, default=repo_root())
    parser.add_argument("--json-out", type=Path, required=True)
    parser.add_argument("--markdown-out", type=Path, required=True)
    parser.add_argument(
        "--hosted-profile",
        action="store_true",
        help="Evaluate hosted Azure profile expectations (default for release-readiness).",
    )
    parser.add_argument("--strict-rc", action="store_true")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    hosted = args.hosted_profile or __import__("os").environ.get("ARCHLUCID_HOSTED_PROFILE", "1") != "0"
    payload = build_payload(args.repo_root.resolve(), hosted_profile=hosted)

    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.markdown_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    args.markdown_out.write_text(render_markdown(payload), encoding="utf-8")

    if args.strict_rc and payload["disposition"] == "HOLD":
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
