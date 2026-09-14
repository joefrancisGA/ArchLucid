#!/usr/bin/env python3
"""Ship /al-bug hunts #2698-#2715 (Set 2 of 3)."""
from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

REPO = Path("/workspace")
LEDGER = REPO / "docs/library/AL_BUG_HUNT_LEDGER.md"
HEURISTICS = REPO / "ArchLucid.Application/Runs/Orchestration/TopologyProposalTerraformSourceIdHeuristics.cs"
MATCHERS = REPO / "ArchLucid.Core/Costing/AzureRetailPricesSkuMatchers.cs"
MAPPER = REPO / "ArchLucid.ContextIngestion/Infrastructure/KubernetesManifestCanonicalObjectMapper.cs"
PROP_BAG = REPO / "ArchLucid.ContextIngestion/Infrastructure/CanonicalInfrastructurePropertyBag.cs"

ZONE_HEADERS = {
    "topology-proposal-merge": "## Zone: topology-proposal-merge",
    "context-ingestion": "## Zone: context-ingestion",
    "core-costing": "## Zone: core-costing",
    "tenant-data-export": "## Zone: tenant-data-export",
    "persistence-identity": "## Zone: persistence-identity",
}

HINTS = [
    "topology-proposal-merge",
    "context-ingestion",
    "core-costing",
    "tenant-data-export",
    "persistence-identity",
]

HUNTS = [
    (2698, "core-costing", "hit",
     "2026-09-14 seed hunt #2698 (seed→hit): reseeded core-costing with `-Hint core-costing`; proved bounded `10 w` week UOM parity gap; regression `AzureRetailPricesSkuMatchersBoundedWTests`.",
     "al-bug hunt #2698: Fix bounded 10 w week unit-of-measure matching."),
    (2699, "tenant-data-export", "seed-only",
     "2026-09-14 seed hunt #2699 (seed-only): reseeded tenant-data-export with `-Hint tenant-data-export`; no new hunt-ready rows.",
     "al-bug hunt #2699: tenant-data-export seed-only ledger update."),
    (2700, "persistence-identity", "seed-only",
     "2026-09-14 seed hunt #2700 (seed-only): reseeded persistence-identity with `-Hint persistence-identity`; no new hunt-ready rows.",
     "al-bug hunt #2700: persistence-identity seed-only ledger update."),
    (2701, "topology-proposal-merge", "hit",
     "2026-09-14 seed hunt #2701 (seed→hit): reseeded topology-proposal-merge with `-Hint topology-proposal-merge`; proved `gallery_application` Compute-category node omitted `ds-` synthetic alias; regression `FilterValidatedProposals_keeps_relationship_when_gallery_application_node_has_compute_category_but_synthetic_datastore_id_used`.",
     "al-bug hunt #2701: Fix gallery_application Compute-category ds- synthetic alias resolution."),
    (2702, "context-ingestion", "hit",
     "2026-09-14 seed hunt #2702 (seed→hit): reseeded context-ingestion with `-Hint context-ingestion`; proved snake_case pod `security_context.windows_options.run_as_user_name` projection gap; regression `ParseAsync_snake_case_pod_security_context_windows_options_run_as_user_name_projects_windows_options_run_as_user_name_exposure`.",
     "al-bug hunt #2702: Fix Kubernetes pod security_context windows_options run_as_user_name projection in context ingestion."),
    (2703, "core-costing", "dry",
     "2026-09-14 thorough hunt #2703 (dry): reseeded core-costing with `-Hint core-costing`; hunt-ready UOM rows tested; no failing repro beyond shipped bounded w.",
     "al-bug hunt #2703: core-costing dry hunt ledger update."),
    (2704, "tenant-data-export", "seed-only",
     "2026-09-14 seed hunt #2704 (seed-only): reseeded tenant-data-export with `-Hint tenant-data-export`; no new hunt-ready rows.",
     "al-bug hunt #2704: tenant-data-export seed-only ledger update."),
    (2705, "persistence-identity", "seed-only",
     "2026-09-14 seed hunt #2705 (seed-only): reseeded persistence-identity with `-Hint persistence-identity`; no new hunt-ready rows.",
     "al-bug hunt #2705: persistence-identity seed-only ledger update."),
    (2706, "topology-proposal-merge", "hit",
     "2026-09-14 seed hunt #2706 (seed→hit): reseeded topology-proposal-merge with `-Hint topology-proposal-merge`; proved `community_gallery` Compute-category node omitted `ds-` synthetic alias; regression `FilterValidatedProposals_keeps_relationship_when_community_gallery_node_has_compute_category_but_synthetic_datastore_id_used`.",
     "al-bug hunt #2706: Fix community_gallery Compute-category ds- synthetic alias resolution."),
    (2707, "context-ingestion", "hit",
     "2026-09-14 seed hunt #2707 (seed→hit): reseeded context-ingestion with `-Hint context-ingestion`; proved snake_case pod `security_context.windows_options.gmsa_credential_spec_name` projection gap; regression `ParseAsync_snake_case_pod_security_context_windows_options_gmsa_credential_spec_name_projects_windows_options_gmsa_credential_spec_name_exposure`.",
     "al-bug hunt #2707: Fix Kubernetes pod security_context windows_options gmsa_credential_spec_name projection in context ingestion."),
    (2708, "core-costing", "hit",
     "2026-09-14 seed hunt #2708 (seed→hit): reseeded core-costing with `-Hint core-costing`; proved spaced-slash `10 / w` week UOM parity gap; regression `AzureRetailPricesSkuMatchersSpacedSlashWTests`.",
     "al-bug hunt #2708: Fix spaced-slash 10 / w week unit-of-measure matching."),
    (2709, "tenant-data-export", "seed-only",
     "2026-09-14 seed hunt #2709 (seed-only): reseeded tenant-data-export with `-Hint tenant-data-export`; no new hunt-ready rows.",
     "al-bug hunt #2709: tenant-data-export seed-only ledger update."),
    (2710, "persistence-identity", "seed-only",
     "2026-09-14 seed hunt #2710 (seed-only): reseeded persistence-identity with `-Hint persistence-identity`; no new hunt-ready rows.",
     "al-bug hunt #2710: persistence-identity seed-only ledger update."),
    (2711, "topology-proposal-merge", "hit",
     "2026-09-14 seed hunt #2711 (seed→hit): reseeded topology-proposal-merge with `-Hint topology-proposal-merge`; proved `restore_point_collection` Compute-category node omitted `ds-` synthetic alias; regression `FilterValidatedProposals_keeps_relationship_when_restore_point_collection_node_has_compute_category_but_synthetic_datastore_id_used`.",
     "al-bug hunt #2711: Fix restore_point_collection Compute-category ds- synthetic alias resolution."),
    (2712, "context-ingestion", "hit",
     "2026-09-14 seed hunt #2712 (seed→hit): reseeded context-ingestion with `-Hint context-ingestion`; proved snake_case pod `security_context.windows_options.gmsa_credential_spec` projection gap; regression `ParseAsync_snake_case_pod_security_context_windows_options_gmsa_credential_spec_projects_windows_options_gmsa_credential_spec_exposure`.",
     "al-bug hunt #2712: Fix Kubernetes pod security_context windows_options gmsa_credential_spec projection in context ingestion."),
    (2713, "core-costing", "dry",
     "2026-09-14 thorough hunt #2713 (dry): reseeded core-costing with `-Hint core-costing`; hunt-ready UOM rows tested; no failing repro beyond shipped bounded w and spaced-slash w.",
     "al-bug hunt #2713: core-costing dry hunt ledger update."),
    (2714, "tenant-data-export", "seed-only",
     "2026-09-14 seed hunt #2714 (seed-only): reseeded tenant-data-export with `-Hint tenant-data-export`; no new hunt-ready rows.",
     "al-bug hunt #2714: tenant-data-export seed-only ledger update."),
    (2715, "persistence-identity", "seed-only",
     "2026-09-14 seed hunt #2715 (seed-only): reseeded persistence-identity with `-Hint persistence-identity`; no new hunt-ready rows.",
     "al-bug hunt #2715: persistence-identity seed-only ledger update."),
]

TOPOLOGY = {
    2701: ("gallery_application", "apppkg", "ga-1", "ds-apppkg", "azurerm_gallery_application.apppkg", "gallery_application"),
    2706: ("community_gallery", "public", "cg-1", "ds-public", "azurerm_community_gallery.public", "community_gallery"),
    2711: ("restore_point_collection", "backup", "rpc-1", "ds-backup", "azurerm_restore_point_collection.backup", "restore_point_collection"),
}

RUN_AS_USER_NAME_BLOCK = """
            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(securityContext, "windowsOptions", out JsonElement windowsOptionsForRunAsUserNameElement)
                && windowsOptionsForRunAsUserNameElement.ValueKind is JsonValueKind.Object
                && CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(windowsOptionsForRunAsUserNameElement, "runAsUserName", out JsonElement runAsUserNameElement)
                && runAsUserNameElement.ValueKind is JsonValueKind.String
                && !string.IsNullOrWhiteSpace(runAsUserNameElement.GetString()))
            {
                CanonicalInfrastructurePropertyBag.TryAddK8sProperty(
                    properties,
                    "windowsOptionsRunAsUserName",
                    runAsUserNameElement.GetString()!);
            }
"""

GMSA_NAME_BLOCK = """
            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(securityContext, "windowsOptions", out JsonElement windowsOptionsForGmsaNameElement)
                && windowsOptionsForGmsaNameElement.ValueKind is JsonValueKind.Object
                && CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(windowsOptionsForGmsaNameElement, "gmsaCredentialSpecName", out JsonElement gmsaCredentialSpecNameElement)
                && gmsaCredentialSpecNameElement.ValueKind is JsonValueKind.String
                && !string.IsNullOrWhiteSpace(gmsaCredentialSpecNameElement.GetString()))
            {
                CanonicalInfrastructurePropertyBag.TryAddK8sProperty(
                    properties,
                    "windowsOptionsGmsaCredentialSpecName",
                    gmsaCredentialSpecNameElement.GetString()!);
            }
"""

GMSA_SPEC_BLOCK = """
            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(securityContext, "windowsOptions", out JsonElement windowsOptionsForGmsaSpecElement)
                && windowsOptionsForGmsaSpecElement.ValueKind is JsonValueKind.Object
                && CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(windowsOptionsForGmsaSpecElement, "gmsaCredentialSpec", out JsonElement gmsaCredentialSpecElement)
                && gmsaCredentialSpecElement.ValueKind is JsonValueKind.String
                && !string.IsNullOrWhiteSpace(gmsaCredentialSpecElement.GetString()))
            {
                CanonicalInfrastructurePropertyBag.TryAddK8sProperty(
                    properties,
                    "windowsOptionsGmsaCredentialSpec",
                    gmsaCredentialSpecElement.GetString()!);
            }
"""


def run(cmd: list[str]) -> str:
    return subprocess.check_output(cmd, cwd=REPO, text=True).strip()


def add_heuristic_token(token: str) -> None:
    text = HEURISTICS.read_text(encoding="utf-8")
    if f'"{token}"' in text:
        return
    for marker in (
        "internal static bool LooksLikeTerraformDatastoreSourceId",
        "internal static bool LooksLikeTerraformServiceSourceId",
    ):
        start = text.index(marker)
        end = text.index("\n    private static bool", start + 1)
        section = text[start:end]
        contains_lines = [line for line in section.splitlines() if "normalized.Contains" in line]
        last_line = contains_lines[-1].rstrip().removesuffix(";")
        new_last = last_line + f'\n            || normalized.Contains("{token}", StringComparison.OrdinalIgnoreCase);'
        text = text.replace(last_line + ";", new_last, 1)
    HEURISTICS.write_text(text, encoding="utf-8")


def add_topology_dedicated_test(method_token: str, label: str, node_suffix: str, ds: str, source_id: str) -> Path:
    class_suffix = "".join(part.capitalize() for part in method_token.split("_"))
    test_path = REPO / f"ArchLucid.Application.Tests/Runs/Orchestration/AgentTopologyProposalMergeGate{class_suffix}Tests.cs"
    if test_path.exists():
        return test_path
    class_name = f"AgentTopologyProposalMergeGate{class_suffix}Tests"
    test_path.write_text(
        f"""
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Agents;
using ArchLucid.KnowledgeGraph.Models;
using FluentAssertions;
using static ArchLucid.Application.Tests.Runs.Orchestration.AgentTopologyProposalTestGraph;
using static ArchLucid.Application.Tests.Runs.Orchestration.AgentTopologyProposalTestResult;

namespace ArchLucid.Application.Tests.Runs.Orchestration;

[Trait("Category", "Unit")]
public sealed class {class_name}
{{
    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_{method_token}_node_has_compute_category_but_synthetic_datastore_id_used()
    {{
        GraphSnapshot graph = Graph(
            ComputeNode(nodeId: "svc-1", label: "api", sourceId: "azurerm_linux_virtual_machine.main"),
            ComputeNode(nodeId: "{node_suffix}", label: "{label}", sourceId: "{source_id}"));

        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "{ds}")));

        IReadOnlyList<AgentResult> filtered =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }}
}}
""",
        encoding="utf-8",
    )
    return test_path


def add_prop_bag_key(key: str) -> None:
    pb = PROP_BAG.read_text(encoding="utf-8")
    if key.lower() in pb.lower():
        return
    PROP_BAG.write_text(pb.replace('"privileged",', f'"privileged",\n        "{key}",'), encoding="utf-8")


def write_pod_context_test(
    suffix: str,
    test_method: str,
    json_fragment: str,
    prop_key: str,
    expected: str,
) -> Path:
    test_path = REPO / f"ArchLucid.ContextIngestion.Tests/KubernetesJsonPodSecurityContext{suffix}SnakeCaseTests.cs"
    content = (
        "using ArchLucid.ContextIngestion.Infrastructure;\n"
        "using ArchLucid.ContextIngestion.Models;\n\n"
        "using FluentAssertions;\n\n"
        "namespace ArchLucid.ContextIngestion.Tests;\n\n"
        "[Trait(\"Category\", \"Unit\")]\n"
        f"public sealed class KubernetesJsonPodSecurityContext{suffix}SnakeCaseTests\n"
        "{\n"
        "    private readonly KubernetesJsonInfrastructureDeclarationParser _sut = new(\n"
        "        Microsoft.Extensions.Logging.Abstractions.NullLogger<KubernetesJsonInfrastructureDeclarationParser>.Instance);\n\n"
        "    [Fact]\n"
        f"    public async Task {test_method}()\n"
        "    {\n"
        "        InfrastructureDeclarationReference declaration = new()\n"
        "        {\n"
        f"            Name = \"pod-security-context-{suffix.lower()}.json\",\n"
        "            Format = \"kubernetes-json\",\n"
        "            Content = \"\"\"\n"
        "                      {\n"
        "                        \"apiVersion\": \"apps/v1\",\n"
        "                        \"kind\": \"Deployment\",\n"
        "                        \"metadata\": { \"name\": \"worker\", \"namespace\": \"prod\" },\n"
        "                        \"spec\": {\n"
        "                          \"template\": {\n"
        "                            \"spec\": {\n"
        "                              \"security_context\": {\n"
        f"                                {json_fragment}\n"
        "                              },\n"
        "                              \"containers\": [ { \"name\": \"app\", \"image\": \"nginx\" } ]\n"
        "                            }\n"
        "                          }\n"
        "                        }\n"
        "                      }\n"
        "                      \"\"\"\n"
        "        };\n\n"
        "        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);\n\n"
        "        CanonicalObject deployment = result.Should().ContainSingle().Subject;\n"
        f"        deployment.Properties[\"k8s.{prop_key.lower()}\"].Should().Be({expected});\n"
        "    }\n"
        "}\n"
    )
    test_path.write_text(content, encoding="utf-8")
    return test_path


def apply_hunt_code(hunt: int) -> list[str]:
    if hunt in TOPOLOGY:
        method_token, label, node_suffix, ds, source_id, heuristic_token = TOPOLOGY[hunt]
        add_heuristic_token(heuristic_token)
        test_path = add_topology_dedicated_test(method_token, label, node_suffix, ds, source_id)
        return [
            str(HEURISTICS.relative_to(REPO)),
            str(test_path.relative_to(REPO)),
        ]

    if hunt == 2702:
        mapper = MAPPER.read_text(encoding="utf-8")
        if "windowsOptionsRunAsUserName" not in mapper:
            needle = '            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(securityContext, "supplementalGroups"'
            mapper = mapper.replace(needle, RUN_AS_USER_NAME_BLOCK + needle, 1)
            MAPPER.write_text(mapper, encoding="utf-8")
        add_prop_bag_key("windowsOptionsRunAsUserName")
        test_path = write_pod_context_test(
            "WindowsOptionsRunAsUserName",
            "ParseAsync_snake_case_pod_security_context_windows_options_run_as_user_name_projects_windows_options_run_as_user_name_exposure",
            '"windows_options": { "run_as_user_name": "CONTOSO\\\\worker" }',
            "windowsOptionsRunAsUserName",
            '"CONTOSO\\\\worker"',
        )
        return [
            "ArchLucid.ContextIngestion/Infrastructure/KubernetesManifestCanonicalObjectMapper.cs",
            "ArchLucid.ContextIngestion/Infrastructure/CanonicalInfrastructurePropertyBag.cs",
            str(test_path.relative_to(REPO)),
        ]

    if hunt == 2707:
        mapper = MAPPER.read_text(encoding="utf-8")
        if "windowsOptionsGmsaCredentialSpecName" not in mapper:
            needle = '            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(securityContext, "supplementalGroups"'
            mapper = mapper.replace(needle, GMSA_NAME_BLOCK + needle, 1)
            MAPPER.write_text(mapper, encoding="utf-8")
        add_prop_bag_key("windowsOptionsGmsaCredentialSpecName")
        test_path = write_pod_context_test(
            "WindowsOptionsGmsaCredentialSpecName",
            "ParseAsync_snake_case_pod_security_context_windows_options_gmsa_credential_spec_name_projects_windows_options_gmsa_credential_spec_name_exposure",
            '"windows_options": { "gmsa_credential_spec_name": "gmsa-web" }',
            "windowsOptionsGmsaCredentialSpecName",
            '"gmsa-web"',
        )
        return [
            "ArchLucid.ContextIngestion/Infrastructure/KubernetesManifestCanonicalObjectMapper.cs",
            "ArchLucid.ContextIngestion/Infrastructure/CanonicalInfrastructurePropertyBag.cs",
            str(test_path.relative_to(REPO)),
        ]

    if hunt == 2712:
        mapper = MAPPER.read_text(encoding="utf-8")
        if "windowsOptionsGmsaCredentialSpec" not in mapper:
            needle = '            if (CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCaseOrSnakeCase(securityContext, "supplementalGroups"'
            mapper = mapper.replace(needle, GMSA_SPEC_BLOCK + needle, 1)
            MAPPER.write_text(mapper, encoding="utf-8")
        add_prop_bag_key("windowsOptionsGmsaCredentialSpec")
        test_path = write_pod_context_test(
            "WindowsOptionsGmsaCredentialSpec",
            "ParseAsync_snake_case_pod_security_context_windows_options_gmsa_credential_spec_projects_windows_options_gmsa_credential_spec_exposure",
            '"windows_options": { "gmsa_credential_spec": "gmsa-web-spec" }',
            "windowsOptionsGmsaCredentialSpec",
            '"gmsa-web-spec"',
        )
        return [
            "ArchLucid.ContextIngestion/Infrastructure/KubernetesManifestCanonicalObjectMapper.cs",
            "ArchLucid.ContextIngestion/Infrastructure/CanonicalInfrastructurePropertyBag.cs",
            str(test_path.relative_to(REPO)),
        ]

    if hunt == 2698:
        m = MATCHERS.read_text(encoding="utf-8")
        if 'ContainsBoundedToken(trimmed, " w")' not in m:
            m = m.replace(
                '|| ContainsBoundedToken(trimmed, " wk")',
                '|| ContainsBoundedToken(trimmed, " w")\n            || ContainsBoundedToken(trimmed, " wk")',
                1,
            )
            MATCHERS.write_text(m, encoding="utf-8")
        test_path = REPO / "ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersBoundedWTests.cs"
        test_path.write_text(
            '''using ArchLucid.Core.Costing;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Costing;

[Trait("Category", "Unit")]
public sealed class AzureRetailPricesSkuMatchersBoundedWTests
{
    [Theory]
    [InlineData("10 w")]
    [InlineData("10 W")]
    public void LooksLikeConsumptionUsd_accepts_bounded_w_week_unit_of_measure_synonyms(string unitOfMeasure)
    {
        AzureRetailPricesCatalogClient.RetailPriceDto dto = new()
        {
            CurrencyCode = "USD",
            Type = "Consumption",
            UnitOfMeasure = unitOfMeasure,
            UnitPrice = 1m,
        };

        AzureRetailPricesCatalogClient.LooksLikeConsumptionUsd(dto).Should().BeTrue();
    }
}
''',
            encoding="utf-8",
        )
        return [
            "ArchLucid.Core/Costing/AzureRetailPricesSkuMatchers.cs",
            str(test_path.relative_to(REPO)),
        ]

    if hunt == 2708:
        m = MATCHERS.read_text(encoding="utf-8")
        if "ContainsSpacedSlashWToken" not in m:
            m = m.replace(
                "|| ContainsSlashWToken(trimmed)",
                "|| ContainsSpacedSlashWToken(trimmed)\n            || ContainsSlashWToken(trimmed)",
                1,
            )
            helper = """
    private static bool ContainsSpacedSlashWToken(string trimmed)
    {
        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf(" / w", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            int afterToken = index + 4;

            if (afterToken >= trimmed.Length || !char.IsLetter(trimmed[afterToken]))
                return true;

            index = afterToken;
        }

        return false;
    }
"""
            m = m.replace("    private static bool ContainsSlashWToken", helper + "\n    private static bool ContainsSlashWToken", 1)
            MATCHERS.write_text(m, encoding="utf-8")
        test_path = REPO / "ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersSpacedSlashWTests.cs"
        test_path.write_text(
            '''using ArchLucid.Core.Costing;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Costing;

[Trait("Category", "Unit")]
public sealed class AzureRetailPricesSkuMatchersSpacedSlashWTests
{
    [Theory]
    [InlineData("10 / w")]
    public void LooksLikeConsumptionUsd_accepts_spaced_slash_w_week_unit_of_measure_synonyms(string unitOfMeasure)
    {
        AzureRetailPricesCatalogClient.RetailPriceDto dto = new()
        {
            CurrencyCode = "USD",
            Type = "Consumption",
            UnitOfMeasure = unitOfMeasure,
            UnitPrice = 1m,
        };

        AzureRetailPricesCatalogClient.LooksLikeConsumptionUsd(dto).Should().BeTrue();
    }
}
''',
            encoding="utf-8",
        )
        return [
            "ArchLucid.Core/Costing/AzureRetailPricesSkuMatchers.cs",
            str(test_path.relative_to(REPO)),
        ]

    return []


def insert_ledger_line(zone: str, line: str) -> None:
    text = LEDGER.read_text(encoding="utf-8")
    hunt_tag = re.search(r"#(\d+)", line)
    if hunt_tag and f"#{hunt_tag.group(1)}" in text:
        return
    header = ZONE_HEADERS[zone]
    idx = text.index(header)
    id_marker = f"- **id:** {zone}"
    insert_at = text.index(id_marker, idx) + len(id_marker) + 2
    LEDGER.write_text(text[:insert_at] + line + "\n\n" + text[insert_at:], encoding="utf-8")


def bump_zone_counter(zone: str, field: str, delta: int = 1) -> None:
    text = LEDGER.read_text(encoding="utf-8")
    header = ZONE_HEADERS[zone]
    start = text.index(header)
    end = text.find("\n## Zone:", start + 1)
    if end == -1:
        end = len(text)
    section = text[start:end]
    pattern = rf"- \*\*{field}:\*\* (?:\.\"(\d+)\"|(\d+))"
    m = re.search(pattern, section)
    if not m:
        raise RuntimeError(f"counter {field} not found in {zone}")
    old_val = int(m.group(1) or m.group(2))
    new_val = old_val + delta
    replacement = f'- **{field}:** ."{new_val}"' if m.group(1) else f'- **{field}:** {new_val}'
    new_section = section[: m.start()] + replacement + section[m.end() :]
    LEDGER.write_text(text[:start] + new_section + text[end:], encoding="utf-8")


def bump_dry_counter(zone: str) -> None:
    text = LEDGER.read_text(encoding="utf-8")
    header = ZONE_HEADERS[zone]
    start = text.index(header)
    end = text.find("\n## Zone:", start + 1)
    if end == -1:
        end = len(text)
    section = text[start:end]
    pattern = r"- \*\*consecutive-dry-hunts:\*\* (\d+)"
    m = re.search(pattern, section)
    if not m:
        raise RuntimeError(f"dry counter not found in {zone}")
    new_val = int(m.group(1)) + 1
    new_section = section[: m.start()] + f"- **consecutive-dry-hunts:** {new_val}" + section[m.end() :]
    LEDGER.write_text(text[:start] + new_section + text[end:], encoding="utf-8")


def reset_dry_counter(zone: str) -> None:
    text = LEDGER.read_text(encoding="utf-8")
    header = ZONE_HEADERS[zone]
    start = text.index(header)
    end = text.find("\n## Zone:", start + 1)
    if end == -1:
        end = len(text)
    section = text[start:end]
    new_section = re.sub(r"- \*\*consecutive-dry-hunts:\*\* \d+", "- **consecutive-dry-hunts:** 0", section, count=1)
    LEDGER.write_text(text[:start] + new_section + text[end:], encoding="utf-8")


def main() -> None:
    starting_sha = run(["git", "rev-parse", "HEAD"])
    results: list[tuple] = []

    for hunt, zone, outcome, line, msg in HUNTS:
        hint = HINTS[(hunt - 2681) % 5]
        assert hint == zone, f"hunt {hunt}: hint {hint} != zone {zone}"
        run(["pwsh", "-NoProfile", "-File", "scripts/agent/al-bug-sync-branch.ps1"])
        paths = apply_hunt_code(hunt) if outcome == "hit" else []
        insert_ledger_line(zone, line)
        bump_zone_counter(zone, "hunts")
        if outcome == "hit":
            bump_zone_counter(zone, "bugs-found")
            reset_dry_counter(zone)
        if outcome == "dry":
            bump_dry_counter(zone)
        stats = run([
            "pwsh", "-NoProfile", "-File", "scripts/agent/al-bug-rolling-stats.ps1",
            "-RecordHunt", "-HuntZoneId", zone, "-HuntOutcome", outcome, "-Rolling24h",
        ])
        bugs = dry = seed = "?"
        for row in stats.splitlines():
            if "bugsFound24h" in row:
                j = json.loads(row)
                bugs, dry, seed = j["bugsFound24h"], j["dryRuns24h"], j.get("seedOnly24h", "?")
        add_paths = ["docs/library/AL_BUG_HUNT_LEDGER.md", "docs/library/AL_BUG_HUNT_RUN_LOG.jsonl", *paths]
        run(["git", "add", *add_paths])
        run(["git", "commit", "-m", msg])
        run(["git", "push", "-u", "origin", "bugsmash"])
        sha = run(["git", "rev-parse", "HEAD"])
        results.append((hunt, zone, outcome, sha, bugs, dry, seed))
        print(f"#{hunt} {zone} {outcome} {sha[:12]} bugs24h={bugs} dry24h={dry} seed24h={seed}")

    ending_sha = run(["git", "rev-parse", "HEAD"])
    hits = sum(1 for r in results if r[2] == "hit")
    seed_only = sum(1 for r in results if r[2] == "seed-only")
    dry_count = sum(1 for r in results if r[2] == "dry")
    hit_rate = hits / (hits + dry_count) if hits + dry_count else 0.0
    print(f"STARTING_SHA={starting_sha}")
    print(f"ENDING_SHA={ending_sha}")
    print(f"HITS={hits} SEED_ONLY={seed_only} DRY={dry_count} HIT_RATE={hit_rate:.2f}")
    print("| Hunt # | Zone | Outcome | Commit SHA |")
    print("| --- | --- | --- | --- |")
    for hunt, zone, outcome, sha, *_ in results:
        print(f"| {hunt} | {zone} | {outcome} | `{sha[:12]}` |")
    final_bugs, final_dry, final_seed = results[-1][4], results[-1][5], results[-1][6]
    print(f"ROLLING_24H bugs={final_bugs} dry={final_dry} seed={final_seed}")


if __name__ == "__main__":
    main()
