#!/usr/bin/env python3
"""Regenerate docs/architecture/data/product-capability-map.json (OP-01 contract)."""

from __future__ import annotations

import json
import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
CONTROLLERS_ROOT = REPO_ROOT / "ArchLucid.Api" / "Controllers"
APPLICATION_ROOT = REPO_ROOT / "ArchLucid.Application"
OUTPUT_PATH = REPO_ROOT / "docs" / "architecture" / "data" / "product-capability-map.json"

CAPABILITIES = ["platform", "authority", "infra-evidence", "governance"]
PRODUCT_LINES = ["architecture", "security", "both"]
STATUSES = ["assigned", "disputed"]

CONTROLLER_OVERRIDES: dict[str, tuple[str, str, str, str | None]] = {
    "ArchLucid.Api.Controllers.InfraEvidence.TenantBrandingAdminController": (
        "infra-evidence",
        "architecture",
        "assigned",
        None,
    ),
    "ArchLucid.Api.Controllers.InfraEvidence.TenantBrandingController": (
        "infra-evidence",
        "architecture",
        "assigned",
        None,
    ),
    "ArchLucid.Api.Controllers.InfraEvidence.BrandAssetController": (
        "infra-evidence",
        "architecture",
        "assigned",
        None,
    ),
    "ArchLucid.Api.Controllers.Governance.ManifestsController": (
        "authority",
        "architecture",
        "assigned",
        None,
    ),
    "ArchLucid.Api.Controllers.Authority.Tier2ConnectionController": (
        "infra-evidence",
        "both",
        "assigned",
        None,
    ),
    "ArchLucid.Api.Controllers.Authority.GcpTier2ConnectionController": (
        "infra-evidence",
        "architecture",
        "assigned",
        None,
    ),
    "ArchLucid.Api.Controllers.RegistrationController": ("platform", "both", "assigned", None),
    "ArchLucid.Api.Controllers.SearchController": ("platform", "both", "assigned", None),
    "ArchLucid.Api.Controllers.VersionController": ("platform", "both", "assigned", None),
    "ArchLucid.Api.Controllers.ValueReports.ValueReportController": (
        "authority",
        "architecture",
        "assigned",
        None,
    ),
    "ArchLucid.Api.Controllers.E2e.E2eHarnessController": (
        "platform",
        "architecture",
        "assigned",
        None,
    ),
    "ArchLucid.Api.Controllers.Integrations.AzureBoardsIntegrationsController": (
        "infra-evidence",
        "architecture",
        "assigned",
        None,
    ),
    "ArchLucid.Api.Controllers.Integrations.SlackInteractivityController": (
        "infra-evidence",
        "architecture",
        "assigned",
        None,
    ),
    "ArchLucid.Api.Controllers.Integrations.WebhookConnectionsController": (
        "infra-evidence",
        "architecture",
        "assigned",
        None,
    ),
    "ArchLucid.Api.Controllers.Integrations.WebhookSimulationController": (
        "infra-evidence",
        "architecture",
        "assigned",
        None,
    ),
}

CONTROLLER_FOLDER_RULES: dict[str, tuple[str, str]] = {
    "Authority": ("authority", "architecture"),
    "Architecture": ("authority", "architecture"),
    "Planning": ("authority", "architecture"),
    "Roi": ("authority", "architecture"),
    "Pilots": ("authority", "architecture"),
    "Evolution": ("authority", "architecture"),
    "Scim": ("authority", "architecture"),
    "Webhooks": ("authority", "architecture"),
    "Mcp": ("authority", "architecture"),
    "Reports": ("authority", "architecture"),
    "Demo": ("authority", "architecture"),
    "Marketing": ("authority", "architecture"),
    "Billing": ("authority", "architecture"),
    "Analytics": ("authority", "architecture"),
    "InfraEvidence": ("infra-evidence", "both"),
    "OperationalSecurity": ("infra-evidence", "both"),
    "Integrations": ("infra-evidence", "both"),
    "Findings": ("governance", "both"),
    "Governance": ("governance", "both"),
    "Alerts": ("governance", "both"),
    "Advisory": ("governance", "both"),
    "ArchitectureIntelligence": ("authority", "architecture"),
    "User": ("platform", "both"),
    "Support": ("platform", "both"),
    "Internal": ("platform", "both"),
    "Diagnostics": ("platform", "both"),
    "Operator": ("platform", "both"),
    "Notifications": ("platform", "both"),
    "Auth": ("platform", "both"),
    "Tenancy": ("platform", "both"),
    "Admin": ("platform", "both"),
    "AgentExecution": ("platform", "both"),
    "E2e": ("platform", "architecture"),
    "ValueReports": ("authority", "architecture"),
}

APPLICATION_OVERRIDES: dict[str, tuple[str, str, str | None]] = {
    "ArchLucid.Application": (
        "authority",
        "disputed",
        "Root Application types span run orchestration and shared helpers.",
    ),
    "ArchLucid.Application.InfraEvidence": ("infra-evidence", "assigned", None),
    "ArchLucid.Application.Runs": ("authority", "assigned", None),
    "ArchLucid.Application.Governance": ("governance", "assigned", None),
    "ArchLucid.Application.Findings": ("governance", "assigned", None),
    "ArchLucid.Application.Planning": ("authority", "assigned", None),
    "ArchLucid.Application.Architecture": ("authority", "assigned", None),
    "ArchLucid.Application.ArchitectureIntelligence": ("authority", "assigned", None),
    "ArchLucid.Application.Billing": ("authority", "assigned", None),
    "ArchLucid.Application.Marketing": ("authority", "assigned", None),
    "ArchLucid.Application.Scim": ("authority", "assigned", None),
    "ArchLucid.Application.Pilots": ("authority", "assigned", None),
    "ArchLucid.Application.Roi": ("authority", "assigned", None),
    "ArchLucid.Application.Evolution": ("authority", "assigned", None),
    "ArchLucid.Application.Integrations": ("infra-evidence", "assigned", None),
    "ArchLucid.Application.Advisory": ("governance", "assigned", None),
    "ArchLucid.Application.Alerts": ("governance", "assigned", None),
    "ArchLucid.Application.TerraformAdvisory": ("infra-evidence", "assigned", None),
    "ArchLucid.Application.AwsExtractor": ("infra-evidence", "assigned", None),
    "ArchLucid.Application.AzureExtractor": ("infra-evidence", "assigned", None),
    "ArchLucid.Application.GcpExtractor": ("infra-evidence", "assigned", None),
    "ArchLucid.Application.CloudExtractor": ("infra-evidence", "assigned", None),
    "ArchLucid.Application.CloudInventoryExtractor": ("infra-evidence", "assigned", None),
}

APPLICATION_FOLDER_RULES: dict[str, str] = {
    "Admin": "platform",
    "Agents": "authority",
    "AiProviders": "platform",
    "AiUsage": "platform",
    "Analysis": "authority",
    "Analytics": "authority",
    "Ask": "authority",
    "Audit": "governance",
    "Authority": "authority",
    "Authorization": "platform",
    "Bootstrap": "platform",
    "Budgeting": "platform",
    "Clarifications": "authority",
    "Common": "platform",
    "Configuration": "platform",
    "Connectors": "infra-evidence",
    "Coordination": "platform",
    "CustomerSuccess": "platform",
    "DataConsistency": "platform",
    "Decisions": "governance",
    "Determinism": "platform",
    "Diagnostics": "platform",
    "Diagrams": "infra-evidence",
    "Diffs": "infra-evidence",
    "Documents": "authority",
    "Drafts": "authority",
    "Evidence": "authority",
    "ExecDigest": "authority",
    "ExecutiveSummary": "authority",
    "Explanation": "authority",
    "Exports": "authority",
    "Http": "platform",
    "Identity": "platform",
    "Import": "authority",
    "Ingestion": "authority",
    "Integration": "infra-evidence",
    "Jobs": "platform",
    "Manifests": "authority",
    "Notifications": "platform",
    "OperationalErrors": "platform",
    "Operations": "platform",
    "Operator": "platform",
    "OperatorHome": "platform",
    "Provenance": "authority",
    "Rendering": "authority",
    "Replay": "authority",
    "Reporting": "authority",
    "Reports": "authority",
    "Search": "platform",
    "SponsorDigest": "authority",
    "Summaries": "authority",
    "Support": "platform",
    "Telemetry": "platform",
    "Templates": "authority",
    "Tenancy": "platform",
    "Traceability": "authority",
    "Trust": "authority",
    "Value": "authority",
    "WeeklyArchitectureDigest": "authority",
    "WeeklyExecutiveSummary": "authority",
}

REQUIRED_APPLICATION_PREFIXES = [
    "ArchLucid.Application.Runs",
    "ArchLucid.Application.InfraEvidence",
    "ArchLucid.Application.Governance",
    "ArchLucid.Application.Findings",
]


def discover_controller_type_names() -> list[str]:
    controllers: set[str] = set()
    for path in sorted(CONTROLLERS_ROOT.rglob("*.cs")):
        if not path.name.endswith("Controller.cs"):
            continue

        if "SealedManifestGuard" in path.name:
            continue

        text = path.read_text(encoding="utf-8")
        namespace_match = re.search(r"namespace\s+([\w.]+);", text)
        if namespace_match is None:
            continue

        namespace = namespace_match.group(1)
        for class_name in re.findall(
            r"public\s+(?:sealed\s+|abstract\s+)?partial\s+class\s+(\w+Controller)\b",
            text,
        ):
            controllers.add(f"{namespace}.{class_name}")

        for class_name in re.findall(
            r"public\s+(?:sealed\s+|abstract\s+)?class\s+(\w+Controller)\b",
            text,
        ):
            controllers.add(f"{namespace}.{class_name}")

    return sorted(controllers)


def controller_folder(type_name: str) -> str:
    parts = type_name.split(".")
    if len(parts) >= 4 and parts[2] == "Controllers":
        return parts[3]

    return parts[-1].replace("Controller", "")


def classify_controller(type_name: str) -> dict[str, object]:
    if type_name in CONTROLLER_OVERRIDES:
        capability, product_line, status, owner_note = CONTROLLER_OVERRIDES[type_name]
        return {
            "typeName": type_name,
            "capability": capability,
            "productLine": product_line,
            "status": status,
            "ownerNote": owner_note,
        }

    folder = controller_folder(type_name)
    if folder in CONTROLLER_FOLDER_RULES:
        capability, product_line = CONTROLLER_FOLDER_RULES[folder]
        return {
            "typeName": type_name,
            "capability": capability,
            "productLine": product_line,
            "status": "assigned",
            "ownerNote": None,
        }

    return {
        "typeName": type_name,
        "capability": "platform",
        "productLine": "both",
        "status": "disputed",
        "ownerNote": f"Unclassified controller folder '{folder}'.",
    }


def discover_application_namespace_prefixes() -> list[str]:
    prefixes = ["ArchLucid.Application"]
    for child in sorted(APPLICATION_ROOT.iterdir()):
        if not child.is_dir():
            continue

        prefixes.append(f"ArchLucid.Application.{child.name}")

    return prefixes


def classify_application_namespace(namespace_prefix: str) -> dict[str, object]:
    if namespace_prefix in APPLICATION_OVERRIDES:
        capability, status, owner_note = APPLICATION_OVERRIDES[namespace_prefix]
        return {
            "namespacePrefix": namespace_prefix,
            "capability": capability,
            "status": status,
            "ownerNote": owner_note,
        }

    if namespace_prefix == "ArchLucid.Application":
        capability, status, owner_note = APPLICATION_OVERRIDES["ArchLucid.Application"]
        return {
            "namespacePrefix": namespace_prefix,
            "capability": capability,
            "status": status,
            "ownerNote": owner_note,
        }

    folder = namespace_prefix.removeprefix("ArchLucid.Application.")
    capability = APPLICATION_FOLDER_RULES.get(folder)
    if capability is None:
        return {
            "namespacePrefix": namespace_prefix,
            "capability": "platform",
            "status": "disputed",
            "ownerNote": f"Unclassified Application folder '{folder}'.",
        }

    return {
        "namespacePrefix": namespace_prefix,
        "capability": capability,
        "status": "assigned",
        "ownerNote": None,
    }


def build_document() -> dict[str, object]:
    controllers = [classify_controller(name) for name in discover_controller_type_names()]
    application_namespaces = [
        classify_application_namespace(prefix)
        for prefix in discover_application_namespace_prefixes()
    ]

    return {
        "version": 1,
        "capabilities": CAPABILITIES,
        "alwaysAllowedRoutePrefixes": ["/health", "/openapi"],
        "controllers": controllers,
        "applicationNamespaces": application_namespaces,
        "requiredApplicationNamespacePrefixes": REQUIRED_APPLICATION_PREFIXES,
    }


def main() -> None:
    document = build_document()
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(
        json.dumps(document, indent=2, sort_keys=False) + "\n",
        encoding="utf-8",
    )
    disputed_controllers = sum(
        1 for row in document["controllers"] if row["status"] == "disputed"
    )
    disputed_namespaces = sum(
        1 for row in document["applicationNamespaces"] if row["status"] == "disputed"
    )
    print(
        f"Wrote {OUTPUT_PATH.relative_to(REPO_ROOT)} "
        f"({len(document['controllers'])} controllers, "
        f"{len(document['applicationNamespaces'])} application namespaces, "
        f"{disputed_controllers} disputed controllers, "
        f"{disputed_namespaces} disputed namespaces)"
    )


def write_namespace_allowlist_placeholder() -> None:
    """Emit an empty allowlist shell; populate via scripts/ci/refresh_product_capability_namespace_allowlist.sh."""
    allowlist_path = REPO_ROOT / "docs" / "architecture" / "data" / "product-capability-namespace-allowlist.json"
    if allowlist_path.exists():
        return

    allowlist_path.parent.mkdir(parents=True, exist_ok=True)
    allowlist_path.write_text(
        json.dumps({"version": 1, "entries": []}, indent=2) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
    write_namespace_allowlist_placeholder()
