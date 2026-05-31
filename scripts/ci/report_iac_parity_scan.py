#!/usr/bin/env python3
"""IaC parity scan — maps configured runtime services to Terraform roots (TB-091+)."""

from __future__ import annotations

import argparse
import json
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

# (config probe, service label, terraform roots in priority order, pilot essential, tf signals)
_SERVICE_MAP: tuple[tuple[str, str, tuple[str, ...], bool, tuple[str, ...]], ...] = (
    (
        "AzureOpenAI:Endpoint",
        "Azure OpenAI",
        ("deploy/hosted-prod-terraform", "infra/terraform/prod", "infra/terraform-openai"),
        True,
        ("azurerm_cognitive_account", "azurerm_cognitive_deployment", "azure-openai", "openai"),
    ),
    (
        "Retrieval:AzureSearch",
        "Azure AI Search",
        ("deploy/hosted-prod-terraform", "infra/terraform/prod", "infra/terraform-search"),
        False,
        ("azurerm_search_service", "azure-search", "Retrieval__AzureSearch__Endpoint"),
    ),
    (
        "KeyVault:VaultUri",
        "Key Vault",
        ("infra/terraform/prod", "infra/terraform-keyvault", "infra/terraform-private"),
        True,
        ("azurerm_key_vault", "key_vault", "keyvault"),
    ),
    (
        "ConnectionStrings:ArchLucid",
        "Azure SQL",
        ("infra/terraform/prod", "infra/terraform-sql-failover"),
        True,
        ("azurerm_mssql_server", "azurerm_sql", "sql", "ConnectionStrings__ArchLucid"),
    ),
    (
        "BlobStorage:ConnectionString",
        "Blob storage",
        ("infra/terraform/prod", "infra/terraform-storage"),
        True,
        ("azurerm_storage_account", "storage_account", "blob"),
    ),
)


@dataclass(frozen=True)
class ConfigProbe:
    key_path: str
    configured: bool
    detail: str


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _read_appsettings(root: Path) -> str:
    parts: list[str] = []
    for name in ("appsettings.json", "appsettings.Production.json", "appsettings.Advanced.json"):
        path = root / "ArchLucid.Api" / name
        if path.is_file():
            parts.append(path.read_text(encoding="utf-8", errors="replace"))
    return "\n".join(parts)


def _json_key_present(config_text: str, key_path: str) -> bool:
    """Return True when colon path appears and is not an empty string literal."""

    segments = key_path.split(":")
    if len(segments) == 1:
        pattern = rf'"{re.escape(segments[0])}"\s*:\s*"(?!")[^"]+"'
        return re.search(pattern, config_text) is not None

    parent, leaf = segments[0], segments[-1]
    block_match = re.search(rf'"{re.escape(parent)}"\s*:\s*\{{', config_text)
    if block_match is None:
        return False

    start = block_match.end() - 1
    depth = 0
    end = start
    for index in range(start, len(config_text)):
        char = config_text[index]
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                end = index + 1
                break

    block = config_text[start:end]
    pattern = rf'"{re.escape(leaf)}"\s*:\s*"(?!")[^"]+"'
    if re.search(pattern, block) is not None:
        return True

    non_string = rf'"{re.escape(leaf)}"\s*:\s*(?!"")(?!null\b)(?!false\b)(?!true\b)[^\s,}}]+'
    return re.search(non_string, block) is not None


def _probe_configuration(config_text: str, key_path: str) -> ConfigProbe:
    if key_path == "Retrieval:AzureSearch":
        vector_index = re.search(r'"VectorIndex"\s*:\s*"([^"]+)"', config_text)
        endpoint = _json_key_present(config_text, "Retrieval:AzureSearch:Endpoint")
        azure_search = (
            vector_index is not None and vector_index.group(1).strip().lower() == "azuresearch"
        ) or endpoint
        return ConfigProbe(
            key_path,
            azure_search,
            "VectorIndex=AzureSearch or Retrieval:AzureSearch:Endpoint present",
        )

    configured = _json_key_present(config_text, key_path)
    return ConfigProbe(key_path, configured, "key present in appsettings*")


def _collect_terraform_text(root: Path, rel: str) -> str:
    directory = root / rel
    if not directory.is_dir():
        return ""

    chunks: list[str] = []
    for path in sorted(directory.rglob("*.tf")):
        chunks.append(path.read_text(encoding="utf-8", errors="replace"))
    return "\n".join(chunks)


def _terraform_supports_service(root: Path, rel: str, signals: tuple[str, ...]) -> tuple[bool, bool, list[str]]:
    directory = root / rel
    if not directory.is_dir():
        return rel, False, []

    text = _collect_terraform_text(root, rel).lower()
    if not text.strip():
        return rel, False, []

    matched = [signal for signal in signals if signal.lower() in text]
    return rel, len(matched) > 0, matched


def _resolve_terraform_root(root: Path, candidates: tuple[str, ...], signals: tuple[str, ...]) -> tuple[str, bool, list[str]]:
    for candidate in candidates:
        rel, supported, matched = _terraform_supports_service(root, candidate, signals)
        if supported:
            return rel, True, matched

    return candidates[0], False, []


def build_report(root: Path) -> dict[str, object]:
    config_text = _read_appsettings(root)
    rows: list[dict[str, object]] = []

    for key, label, tf_roots, pilot_essential, tf_signals in _SERVICE_MAP:
        probe = _probe_configuration(config_text, key)
        tf_root, tf_supported, matched_signals = _resolve_terraform_root(root, tf_roots, tf_signals)

        if not probe.configured:
            disposition = "NOT_CONFIGURED"
        elif tf_supported:
            disposition = "PASS"
        elif pilot_essential:
            disposition = "HOLD"
        else:
            disposition = "WARN"

        rows.append(
            {
                "service": label,
                "configKey": key,
                "configuredInAppsettings": probe.configured,
                "configurationDetail": probe.detail,
                "terraformRoot": tf_root,
                "terraformRootsChecked": list(tf_roots),
                "terraformSignalsMatched": matched_signals,
                "terraformSupported": tf_supported,
                "pilotEssential": pilot_essential,
                "disposition": disposition,
            }
        )

    hold_count = sum(1 for row in rows if row["disposition"] == "HOLD")
    overall = "PASS" if hold_count == 0 else "HOLD"

    return {
        "schema": "archlucid.iac-parity-scan.v2",
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "disposition": overall,
        "rows": rows,
        "notes": [
            "Configured means key appears in ArchLucid.Api appsettings*.json — not live deployment proof.",
            "Terraform support scans all *.tf files under each root for resource/module/output signals.",
            "Authoritative hosted production root is deploy/hosted-prod-terraform (synced from infra/terraform/prod when present).",
            "Redis, Cosmos DB polyglot persistence, and Azure Service Bus are optional V1.1/V2 paths — not scanned here (see REDIS_AND_MULTI_REGION.md, INTEGRATION_EVENTS_AND_WEBHOOKS.md).",
        ],
    }


def render_markdown(report: dict[str, object]) -> str:
    lines = [
        "# IaC parity scan",
        "",
        f"**Generated UTC:** {report['generatedUtc']}",
        f"**Disposition:** {report['disposition']}",
        "",
        "| Service | Config key | TF root | Disposition |",
        "| --- | --- | --- | --- |",
    ]
    for row in report["rows"]:
        lines.append(
            f"| {row['service']} | `{row['configKey']}` | `{row['terraformRoot']}` | **{row['disposition']}** |"
        )
    lines.append("")
    for note in report["notes"]:
        lines.append(f"- {note}")
    lines.append("")
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--out-json",
        type=Path,
        default=repo_root() / "artifacts" / "release" / "iac-parity-scan.json",
    )
    parser.add_argument(
        "--out-md",
        type=Path,
        default=repo_root() / "artifacts" / "release" / "iac-parity-scan.md",
    )
    args = parser.parse_args()

    root = repo_root()
    report = build_report(root)

    args.out_json.parent.mkdir(parents=True, exist_ok=True)
    args.out_json.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    args.out_md.write_text(render_markdown(report), encoding="utf-8")

    print(f"Wrote {args.out_json}")
    print(f"Wrote {args.out_md}")
    return 0 if report["disposition"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
