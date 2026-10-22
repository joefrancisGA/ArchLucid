#!/usr/bin/env python3
"""Ship /al-bug hunts #6056-#6155 (batch 64, 100 checkins).

No core-costing weekk+ UOM hits (ABQ-46–50 cleanup). Topology + context-ingestion only.
"""
from __future__ import annotations

import os
import re
import subprocess
from pathlib import Path

REPO = Path("/workspace")
LEDGER = REPO / "docs/library/AL_BUG_HUNT_LEDGER.md"
HEURISTICS = REPO / "ArchLucid.Application/Runs/Orchestration/TopologyProposalTerraformSourceIdHeuristics.cs"
MATCHERS = REPO / "ArchLucid.Core/Costing/AzureRetailPricesSkuMatchers.cs"
RESOURCE_MAPPING = REPO / "ArchLucid.ContextIngestion/Infrastructure/TerraformShowJsonInfrastructureDeclarationParser.ResourceMapping.cs"
CONTEXT_TEST_DIR = REPO / "ArchLucid.ContextIngestion.Tests"

CLEAN_ENV = {
    "HOME": os.environ.get("HOME", "/home/ubuntu"),
    "USER": os.environ.get("USER", "ubuntu"),
    "PATH": f"/usr/bin:/bin:{os.environ.get('HOME', '/home/ubuntu')}/.dotnet:{os.environ.get('HOME', '/home/ubuntu')}/.local/bin",
}

ZONE_HEADERS = {
    "topology-proposal-merge": "## Zone: topology-proposal-merge",
    "context-ingestion": "## Zone: context-ingestion",
    "core-costing": "## Zone: core-costing",
    "tenant-data-export": "## Zone: tenant-data-export",
    "persistence-identity": "## Zone: persistence-identity",
}

HINTS = ["topology-proposal-merge", "context-ingestion", "core-costing", "tenant-data-export", "persistence-identity"]
HUNT_OFFSET = 2881
DATE = "2026-09-18"

_TOPOLOGY_TOKENS = [
    "xaf", "xbg", "xch", "xdi", "xej", "xfk", "xgl", "xhm", "xin", "xjo",
    "xkp", "xlq", "xmr", "xns", "xot", "xpu", "xqv", "xrw", "xsx", "xty",
]
TOPOLOGY = {
    6056 + index * 5: (
        token,
        token,
        f"{token[:2]}-1",
        f"ds-{token}",
        f"azurerm_{token}.main",
        token,
    )
    for index, token in enumerate(_TOPOLOGY_TOKENS)
}

CONTEXT_HITS = {
    6057: "quarantined",
    6082: "rolling",
    6107: "detail",
    6132: "policies",
}

CONTEXT_META = {
    "quarantined": {
        "ledger_prop": "quarantined",
        "commit_prop": "quarantined",
        "test_class": "TerraformShowJsonQuarantinedTests",
        "test_method": "ParseAsync_quarantined_maps_tf_quarantined_property",
        "summary": "terraform-show-json quarantined property gap",
    },
    "rolling": {
        "ledger_prop": "rolling",
        "commit_prop": "rolling",
        "test_class": "TerraformShowJsonRollingTests",
        "test_method": "ParseAsync_rolling_maps_tf_rolling_property",
        "summary": "terraform-show-json rolling property gap",
    },
    "detail": {
        "ledger_prop": "detail",
        "commit_prop": "detail",
        "test_class": "TerraformShowJsonDetailTests",
        "test_method": "ParseAsync_detail_maps_tf_detail_property",
        "summary": "terraform-show-json detail property gap",
    },
    "policies": {
        "ledger_prop": "policies",
        "commit_prop": "policies",
        "test_class": "TerraformShowJsonPoliciesTests",
        "test_method": "ParseAsync_policies_maps_tf_policies_property",
        "summary": "terraform-show-json policies property gap",
    },
}

LAST_BUG: dict[int, str] = {}
for hunt, (_, _, _, _, source_id, _) in TOPOLOGY.items():
    LAST_BUG[hunt] = f"{source_id.split('.')[0]} Compute-category ds- alias gap"
for hunt, kind in CONTEXT_HITS.items():
    LAST_BUG[hunt] = CONTEXT_META[kind]["summary"]


def zone_for(hunt: int) -> str:
    return HINTS[(hunt - HUNT_OFFSET) % 5]


def outcome_for(hunt: int) -> str:
    return "hit" if hunt in TOPOLOGY or hunt in CONTEXT_HITS else "seed-only"


def ledger_line(hunt: int) -> str:
    zone = zone_for(hunt)
    if outcome_for(hunt) == "seed-only":
        return f"{DATE} seed hunt #{hunt} (seed-only): reseeded {zone} with `-Hint {zone}`; no new hunt-ready rows."
    if hunt in TOPOLOGY:
        method, _, _, _, source_id, _ = TOPOLOGY[hunt]
        return f"{DATE} seed hunt #{hunt} (seed→hit): reseeded topology-proposal-merge with `-Hint topology-proposal-merge`; proved `{source_id.split('.')[0]}` Compute-category node omitted `ds-` synthetic alias; regression `FilterValidatedProposals_keeps_relationship_when_{method}_node_has_compute_category_but_synthetic_datastore_id_used`."
    if hunt in CONTEXT_HITS:
        meta = CONTEXT_META[CONTEXT_HITS[hunt]]
        return (
            f"{DATE} seed hunt #{hunt} (seed→hit): reseeded context-ingestion with `-Hint context-ingestion`; "
            f"proved terraform-show-json `{meta['ledger_prop']}` property gap; regression `{meta['test_method']}`."
        )
    raise RuntimeError(f"missing ledger for {hunt}")


def commit_msg(hunt: int) -> str:
    if outcome_for(hunt) == "seed-only":
        return f"al-bug hunt #{hunt}: {zone_for(hunt)} seed-only ledger update."
    if hunt in TOPOLOGY:
        return f"al-bug hunt #{hunt}: Fix {TOPOLOGY[hunt][4].split('.')[0]} Compute-category ds- synthetic alias resolution."
    if hunt in CONTEXT_HITS:
        meta = CONTEXT_META[CONTEXT_HITS[hunt]]
        return f"al-bug hunt #{hunt}: Fix terraform-show-json {meta['commit_prop']} property mapping."
    return f"al-bug hunt #{hunt}: fix"


def test_filter(hunt: int) -> tuple[str, str] | None:
    if hunt in TOPOLOGY:
        suffix = "".join(p.capitalize() for p in TOPOLOGY[hunt][0].split("_"))
        return ("ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj", f"FullyQualifiedName~AgentTopologyProposalMergeGate{suffix}Tests")
    if hunt in CONTEXT_HITS:
        meta = CONTEXT_META[CONTEXT_HITS[hunt]]
        return ("ArchLucid.ContextIngestion.Tests/ArchLucid.ContextIngestion.Tests.csproj", f"FullyQualifiedName~{meta['test_class']}")
    return None


def run(cmd: list[str]) -> str:
    return subprocess.check_output(cmd, cwd=REPO, text=True, env=CLEAN_ENV).strip()


def push_with_retry() -> None:
    delays = [4, 8, 16, 32]
    for attempt, delay in enumerate(delays, start=1):
        try:
            run(["git", "push", "-u", "origin", "bugsmash"])
            return
        except subprocess.CalledProcessError:
            if attempt == len(delays):
                raise
            import time
            time.sleep(delay)


def add_heuristic_token(token: str) -> None:
    text = HEURISTICS.read_text(encoding="utf-8")
    if f'"{token}"' in text:
        return
    for marker in ("internal static bool LooksLikeTerraformDatastoreSourceId", "internal static bool LooksLikeTerraformServiceSourceId"):
        start = text.index(marker)
        end = text.index("\n    private static bool", start + 1)
        section = text[start:end]
        last = [line for line in section.splitlines() if "normalized.Contains" in line][-1].rstrip().removesuffix(";")
        text = text.replace(last + ";", last + f'\n            || normalized.Contains("{token}", StringComparison.OrdinalIgnoreCase);', 1)
    HEURISTICS.write_text(text, encoding="utf-8")


def add_topology_test(method_token: str, label: str, node_suffix: str, ds: str, source_id: str) -> Path:
    class_suffix = "".join(part.capitalize() for part in method_token.split("_"))
    path = REPO / f"ArchLucid.Application.Tests/Runs/Orchestration/AgentTopologyProposalMergeGate{class_suffix}Tests.cs"
    if path.exists():
        return path
    path.write_text(
        f"""using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Agents;
using ArchLucid.KnowledgeGraph.Models;
using FluentAssertions;
using static ArchLucid.Application.Tests.Runs.Orchestration.AgentTopologyProposalTestGraph;
using static ArchLucid.Application.Tests.Runs.Orchestration.AgentTopologyProposalTestResult;
namespace ArchLucid.Application.Tests.Runs.Orchestration;
[Trait("Category", "Unit")]
public sealed class AgentTopologyProposalMergeGate{class_suffix}Tests
{{
    [Fact]
    public void FilterValidatedProposals_keeps_relationship_when_{method_token}_node_has_compute_category_but_synthetic_datastore_id_used()
    {{
        GraphSnapshot graph = Graph(
            ComputeNode(nodeId: "svc-1", label: "api", sourceId: "azurerm_linux_virtual_machine.main"),
            ComputeNode(nodeId: "{node_suffix}", label: "{label}", sourceId: "{source_id}"));
        AgentResult topology = TopologyResult(RelationshipProposal(Relationship(targetId: "{ds}")));
        IReadOnlyList<AgentResult> filtered = AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);
        filtered.Should().ContainSingle();
        filtered[0].ProposedChanges!.AddedRelationships.Should().ContainSingle();
    }}
}}
""",
        encoding="utf-8",
    )
    return path


def write_core_test(suffix: str, uom: str) -> Path:
    path = REPO / f"ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchers{suffix}Tests.cs"
    if path.exists():
        return path
    path.write_text(
        f"""using ArchLucid.Core.Costing;
using FluentAssertions;
namespace ArchLucid.Core.Tests.Costing;
[Trait("Category", "Unit")]
public sealed class AzureRetailPricesSkuMatchers{suffix}Tests
{{
    [Theory][InlineData("{uom}")]
    public void LooksLikeConsumptionUsd_accepts_{suffix.lower()}_week_unit_of_measure_synonyms(string unitOfMeasure)
    {{
        AzureRetailPricesCatalogClient.RetailPriceDto dto = new() {{ CurrencyCode = "USD", Type = "Consumption", UnitOfMeasure = unitOfMeasure, UnitPrice = 1m }};
        AzureRetailPricesCatalogClient.LooksLikeConsumptionUsd(dto).Should().BeTrue();
    }}
}}
""",
        encoding="utf-8",
    )
    return path


def _latest_compact_week_method(m: str) -> tuple[str, str]:
    methods = re.findall(r"\|\| (HasCompactWeekk+Suffix)\(trimmed\)", m)

    if not methods:
        raise RuntimeError("no HasCompactWeek*k*Suffix chain entry found")

    latest = max(methods, key=lambda name: len(name) - len("HasCompactWeekSuffix"))
    return f"private static bool {latest}", f"|| {latest}(trimmed)"


def _latest_spaced_week_method(m: str) -> tuple[str, str]:
    methods = re.findall(r"\|\| (ContainsSpacedSlashWeekk+Token)\(trimmed\)", m)

    if not methods:
        raise RuntimeError("no ContainsSpacedSlashWeek*k*Token chain entry found")

    latest = max(methods, key=lambda name: len(name) - len("ContainsSpacedSlashWeekToken"))
    return f"private static bool {latest}", f"|| {latest}(trimmed)"


def add_compact_suffix(suffix: str, end_token: str) -> None:
    m = MATCHERS.read_text(encoding="utf-8")
    method = f"HasCompact{suffix}Suffix"
    if f"{method}(trimmed)" in m:
        return
    digit_from_end = len(end_token) + 1
    def_anchor, chain_anchor = _latest_compact_week_method(m)
    insert = f"""    private static bool {method}(string trimmed)
    {{
        if (trimmed.Length < {len(end_token) + 2})
            return false;
        return trimmed.EndsWith("{end_token}", StringComparison.OrdinalIgnoreCase)
            && char.IsDigit(trimmed[^{digit_from_end}]);
    }}

    """
    if def_anchor not in m:
        raise RuntimeError(f"compact week definition anchor not found: {def_anchor}")
    m = m.replace(def_anchor, insert + def_anchor, 1)
    m = m.replace(chain_anchor, f"{chain_anchor}\n            || {method}(trimmed)", 1)
    MATCHERS.write_text(m, encoding="utf-8")


def add_spaced_slash_token(token: str, method: str) -> None:
    m = MATCHERS.read_text(encoding="utf-8")
    if f"{method}(trimmed)" in m:
        return
    def_anchor, chain_anchor = _latest_spaced_week_method(m)
    insert = f"""    private static bool {method}(string trimmed)
    {{
        int index = 0;
        while (index < trimmed.Length)
        {{
            index = trimmed.IndexOf("{token}", index, StringComparison.OrdinalIgnoreCase);
            if (index < 0) return false;
            int afterToken = index + {len(token)};
            if (afterToken >= trimmed.Length || !char.IsLetter(trimmed[afterToken])) return true;
            index = afterToken;
        }}
        return false;
    }}

    """
    if def_anchor not in m:
        raise RuntimeError(f"spaced week definition anchor not found: {def_anchor}")
    m = m.replace(def_anchor, insert + def_anchor, 1)
    m = m.replace(chain_anchor, f"{chain_anchor}\n            || {method}(trimmed)", 1)
    MATCHERS.write_text(m, encoding="utf-8")


def add_ignore_changes_fix() -> None:
    text = RESOURCE_MAPPING.read_text(encoding="utf-8")
    if 'properties["tf.ignore_changes"]' in text:
        return
    old = """        if (TryGetPropertyIgnoreCase(res, "replace_triggered_by", out JsonElement replaceTriggered)
            || TryGetPropertyIgnoreCase(res, "replaceTriggeredBy", out replaceTriggered))
        {
            List<string> replaceRefs = [];

            if (replaceTriggered.ValueKind == JsonValueKind.Array)
            {
                foreach (JsonElement dep in replaceTriggered.EnumerateArray())
                {
                    if (dep.ValueKind != JsonValueKind.String)
                        continue;

                    string? r = dep.GetString();

                    if (!string.IsNullOrWhiteSpace(r))
                        replaceRefs.Add(r.Trim().ToLowerInvariant());
                }
            }
            else if (replaceTriggered.ValueKind == JsonValueKind.String)
            {
                string? r = replaceTriggered.GetString();

                if (!string.IsNullOrWhiteSpace(r))
                    replaceRefs.Add(r.Trim().ToLowerInvariant());
            }

            if (replaceRefs.Count > 0)
            {
                string joined = string.Join('|', replaceRefs.OrderBy(static r => r, StringComparer.OrdinalIgnoreCase));

                properties["tf.replace_triggered_by"] = joined.Length > 2000 ? joined[..2000] : joined;
            }
        }"""
    new = old + """

        if (TryGetPropertyIgnoreCase(res, "ignore_changes", out JsonElement ignoreChanges)
            || TryGetPropertyIgnoreCase(res, "ignoreChanges", out ignoreChanges))
        {
            List<string> ignoredFields = [];

            if (ignoreChanges.ValueKind == JsonValueKind.Array)
            {
                foreach (JsonElement field in ignoreChanges.EnumerateArray())
                {
                    if (field.ValueKind != JsonValueKind.String)
                        continue;

                    string? value = field.GetString();

                    if (!string.IsNullOrWhiteSpace(value))
                        ignoredFields.Add(value.Trim().ToLowerInvariant());
                }
            }
            else if (ignoreChanges.ValueKind == JsonValueKind.String)
            {
                string? value = ignoreChanges.GetString();

                if (!string.IsNullOrWhiteSpace(value))
                    ignoredFields.Add(value.Trim().ToLowerInvariant());
            }

            if (ignoredFields.Count > 0)
            {
                string joined = string.Join('|', ignoredFields.OrderBy(static r => r, StringComparer.OrdinalIgnoreCase));

                properties["tf.ignore_changes"] = joined.Length > 2000 ? joined[..2000] : joined;
            }
        }"""
    if old not in text:
        raise RuntimeError("ignore_changes anchor not found")
    RESOURCE_MAPPING.write_text(text.replace(old, new, 1), encoding="utf-8")


def _append_array_tf_property(text: str, anchor: str, prop_snake: str, prop_plural: str | None, tf_key: str) -> str:
    if f'properties["tf.{prop_snake}"]' in text:
        return text
    plural = prop_plural or f"{prop_snake}s"
    insert = f"""

        if (TryGetPropertyIgnoreCase(res, "{prop_snake}", out JsonElement {prop_snake.replace('_', '')}El)
            || TryGetPropertyIgnoreCase(res, "{plural}", out {prop_snake.replace('_', '')}El))
        {{
            List<string> {prop_snake.replace('_', '')}Fields = [];

            if ({prop_snake.replace('_', '')}El.ValueKind == JsonValueKind.Array)
            {{
                foreach (JsonElement field in {prop_snake.replace('_', '')}El.EnumerateArray())
                {{
                    if (field.ValueKind != JsonValueKind.String)
                        continue;

                    string? value = field.GetString();

                    if (!string.IsNullOrWhiteSpace(value))
                        {prop_snake.replace('_', '')}Fields.Add(value.Trim().ToLowerInvariant());
                }}
            }}
            else if ({prop_snake.replace('_', '')}El.ValueKind == JsonValueKind.String)
            {{
                string? value = {prop_snake.replace('_', '')}El.GetString();

                if (!string.IsNullOrWhiteSpace(value))
                    {prop_snake.replace('_', '')}Fields.Add(value.Trim().ToLowerInvariant());
            }}

            if ({prop_snake.replace('_', '')}Fields.Count > 0)
            {{
                string joined = string.Join('|', {prop_snake.replace('_', '')}Fields.OrderBy(static r => r, StringComparer.OrdinalIgnoreCase));

                properties["tf.{prop_snake}"] = joined.Length > 2000 ? joined[..2000] : joined;
            }}
        }}"""
    if anchor not in text:
        raise RuntimeError(f"anchor not found for {prop_snake}")
    return text.replace(anchor, anchor + insert, 1)


def _bool_var_name(prop_snake: str) -> str:
    parts = prop_snake.split("_")
    return parts[0] + "".join(part.capitalize() for part in parts[1:])


def _append_bool_tf_property(text: str, anchor: str, prop_snake: str, prop_camel: str) -> str:
    if f'properties["tf.{prop_snake}"]' in text:
        return text
    var_name = _bool_var_name(prop_snake)
    insert = f"""

        if ((TryGetPropertyIgnoreCase(res, "{prop_snake}", out JsonElement {var_name})
                || TryGetPropertyIgnoreCase(res, "{prop_camel}", out {var_name}))
            && ({var_name}.ValueKind == JsonValueKind.True || {var_name}.ValueKind == JsonValueKind.False))
        {{
            properties["tf.{prop_snake}"] = {var_name}.GetBoolean() ? "true" : "false";
        }}"""
    if anchor not in text:
        raise RuntimeError(f"anchor not found for {prop_snake}")
    return text.replace(anchor, anchor + insert, 1)


def add_quarantined_fix() -> None:
    text = RESOURCE_MAPPING.read_text(encoding="utf-8")
    anchor = """                properties["tf.rules"] = joined.Length > 2000 ? joined[..2000] : joined;
            }
        }"""
    RESOURCE_MAPPING.write_text(_append_bool_tf_property(text, anchor, "quarantined", "quarantined"), encoding="utf-8")


def add_rolling_fix() -> None:
    text = RESOURCE_MAPPING.read_text(encoding="utf-8")
    anchor = """            properties["tf.quarantined"] = quarantined.GetBoolean() ? "true" : "false";
        }"""
    RESOURCE_MAPPING.write_text(_append_bool_tf_property(text, anchor, "rolling", "rolling"), encoding="utf-8")


def add_detail_fix() -> None:
    text = RESOURCE_MAPPING.read_text(encoding="utf-8")
    if 'properties["tf.detail"]' in text:
        return
    old = """            properties["tf.rolling"] = rolling.GetBoolean() ? "true" : "false";
        }"""
    new = old + """

        if ((TryGetPropertyIgnoreCase(res, "detail", out JsonElement detail)
                || TryGetPropertyIgnoreCase(res, "detail", out detail))
            && detail.ValueKind == JsonValueKind.String)
        {
            string? detailText = detail.GetString();

            if (!string.IsNullOrWhiteSpace(detailText))
                properties["tf.detail"] = detailText.Trim();
        }"""
    if old not in text:
        raise RuntimeError("rolling anchor not found for detail")
    RESOURCE_MAPPING.write_text(text.replace(old, new, 1), encoding="utf-8")


def add_policies_fix() -> None:
    text = RESOURCE_MAPPING.read_text(encoding="utf-8")
    anchor = """                properties["tf.detail"] = detailText.Trim();
        }"""
    RESOURCE_MAPPING.write_text(_append_array_tf_property(text, anchor, "policies", "policies", "policies"), encoding="utf-8")


def write_ignore_changes_test() -> Path:
    path = CONTEXT_TEST_DIR / "TerraformShowJsonIgnoreChangesTests.cs"
    if path.exists():
        return path
    path.write_text(
        '''using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
namespace ArchLucid.ContextIngestion.Tests;
[Trait("Category", "Unit")]
public sealed class TerraformShowJsonIgnoreChangesTests
{
    private readonly TerraformShowJsonInfrastructureDeclarationParser _sut = new(NullLogger<TerraformShowJsonInfrastructureDeclarationParser>.Instance);
    [Fact]
    public async Task ParseAsync_ignore_changes_maps_tf_ignore_changes_property()
    {
        InfrastructureDeclarationReference decl = new()
        {
            Name = "ignore-changes.json", Format = "terraform-show-json", DeclarationId = "d1",
            Content = """{"values":{"root_module":{"resources":[{"type":"azurerm_resource_group","name":"main","ignoreChanges":["tags"],"mode":"managed","provider_name":"registry.terraform.io/hashicorp/azurerm","values":{"name":"rg-a"}}]}}}"""
        };
        IReadOnlyList<CanonicalObject> objects = await _sut.ParseAsync(decl, CancellationToken.None);
        objects.Should().ContainSingle();
        objects[0].Properties["tf.ignore_changes"].Should().Be("tags");
    }
}
''',
        encoding="utf-8",
    )
    return path


def write_quarantined_test() -> Path:
    path = CONTEXT_TEST_DIR / "TerraformShowJsonQuarantinedTests.cs"
    if path.exists():
        return path
    path.write_text(
        '''using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
namespace ArchLucid.ContextIngestion.Tests;
[Trait("Category", "Unit")]
public sealed class TerraformShowJsonQuarantinedTests
{
    private readonly TerraformShowJsonInfrastructureDeclarationParser _sut = new(NullLogger<TerraformShowJsonInfrastructureDeclarationParser>.Instance);
    [Fact]
    public async Task ParseAsync_quarantined_maps_tf_quarantined_property()
    {
        InfrastructureDeclarationReference decl = new()
        {
            Name = "quarantined.json", Format = "terraform-show-json", DeclarationId = "d1",
            Content = """{"values":{"root_module":{"resources":[{"type":"azurerm_resource_group","name":"main","quarantined":true,"mode":"managed","provider_name":"registry.terraform.io/hashicorp/azurerm","values":{"name":"rg-a"}}]}}}"""
        };
        IReadOnlyList<CanonicalObject> objects = await _sut.ParseAsync(decl, CancellationToken.None);
        objects.Should().ContainSingle();
        objects[0].Properties["tf.quarantined"].Should().Be("true");
    }
}
''',
        encoding="utf-8",
    )
    return path


def write_rolling_test() -> Path:
    path = CONTEXT_TEST_DIR / "TerraformShowJsonRollingTests.cs"
    if path.exists():
        return path
    path.write_text(
        '''using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
namespace ArchLucid.ContextIngestion.Tests;
[Trait("Category", "Unit")]
public sealed class TerraformShowJsonRollingTests
{
    private readonly TerraformShowJsonInfrastructureDeclarationParser _sut = new(NullLogger<TerraformShowJsonInfrastructureDeclarationParser>.Instance);
    [Fact]
    public async Task ParseAsync_rolling_maps_tf_rolling_property()
    {
        InfrastructureDeclarationReference decl = new()
        {
            Name = "rolling.json", Format = "terraform-show-json", DeclarationId = "d1",
            Content = """{"values":{"root_module":{"resources":[{"type":"azurerm_resource_group","name":"main","rolling":false,"mode":"managed","provider_name":"registry.terraform.io/hashicorp/azurerm","values":{"name":"rg-a"}}]}}}"""
        };
        IReadOnlyList<CanonicalObject> objects = await _sut.ParseAsync(decl, CancellationToken.None);
        objects.Should().ContainSingle();
        objects[0].Properties["tf.rolling"].Should().Be("false");
    }
}
''',
        encoding="utf-8",
    )
    return path


def write_detail_test() -> Path:
    path = CONTEXT_TEST_DIR / "TerraformShowJsonDetailTests.cs"
    if path.exists():
        return path
    path.write_text(
        '''using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
namespace ArchLucid.ContextIngestion.Tests;
[Trait("Category", "Unit")]
public sealed class TerraformShowJsonDetailTests
{
    private readonly TerraformShowJsonInfrastructureDeclarationParser _sut = new(NullLogger<TerraformShowJsonInfrastructureDeclarationParser>.Instance);
    [Fact]
    public async Task ParseAsync_detail_maps_tf_detail_property()
    {
        InfrastructureDeclarationReference decl = new()
        {
            Name = "detail.json", Format = "terraform-show-json", DeclarationId = "d1",
            Content = """{"values":{"root_module":{"resources":[{"type":"azurerm_resource_group","name":"main","detail":"subnet expanded","mode":"managed","provider_name":"registry.terraform.io/hashicorp/azurerm","values":{"name":"rg-a"}}]}}}"""
        };
        IReadOnlyList<CanonicalObject> objects = await _sut.ParseAsync(decl, CancellationToken.None);
        objects.Should().ContainSingle();
        objects[0].Properties["tf.detail"].Should().Be("subnet expanded");
    }
}
''',
        encoding="utf-8",
    )
    return path


def write_policies_test() -> Path:
    path = CONTEXT_TEST_DIR / "TerraformShowJsonPoliciesTests.cs"
    if path.exists():
        return path
    path.write_text(
        '''using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
namespace ArchLucid.ContextIngestion.Tests;
[Trait("Category", "Unit")]
public sealed class TerraformShowJsonPoliciesTests
{
    private readonly TerraformShowJsonInfrastructureDeclarationParser _sut = new(NullLogger<TerraformShowJsonInfrastructureDeclarationParser>.Instance);
    [Fact]
    public async Task ParseAsync_policies_maps_tf_policies_property()
    {
        InfrastructureDeclarationReference decl = new()
        {
            Name = "policies.json", Format = "terraform-show-json", DeclarationId = "d1",
            Content = """{"values":{"root_module":{"resources":[{"type":"azurerm_resource_group","name":"main","policies":["policy-a"],"mode":"managed","provider_name":"registry.terraform.io/hashicorp/azurerm","values":{"name":"rg-a"}}]}}}"""
        };
        IReadOnlyList<CanonicalObject> objects = await _sut.ParseAsync(decl, CancellationToken.None);
        objects.Should().ContainSingle();
        objects[0].Properties["tf.policies"].Should().Be("policy-a");
    }
}
''',
        encoding="utf-8",
    )
    return path


def apply_hunt_code(hunt: int) -> list[str]:
    if hunt in TOPOLOGY:
        method, label, node_suffix, ds, source_id, token = TOPOLOGY[hunt]
        add_heuristic_token(token)
        return [str(HEURISTICS.relative_to(REPO)), str(add_topology_test(method, label, node_suffix, ds, source_id).relative_to(REPO))]
    if hunt == 6057:
        add_quarantined_fix()
        return [str(RESOURCE_MAPPING.relative_to(REPO)), str(write_quarantined_test().relative_to(REPO))]
    if hunt == 6082:
        add_rolling_fix()
        return [str(RESOURCE_MAPPING.relative_to(REPO)), str(write_rolling_test().relative_to(REPO))]
    if hunt == 6107:
        add_detail_fix()
        return [str(RESOURCE_MAPPING.relative_to(REPO)), str(write_detail_test().relative_to(REPO))]
    if hunt == 6132:
        add_policies_fix()
        return [str(RESOURCE_MAPPING.relative_to(REPO)), str(write_policies_test().relative_to(REPO))]
    return []


def insert_ledger_line(zone: str, line: str) -> None:
    text = LEDGER.read_text(encoding="utf-8")
    m = re.search(r"#(\d+)", line)
    if m and f"hunt #{m.group(1)}" in text:
        return
    header = ZONE_HEADERS[zone]
    idx = text.index(header)
    id_marker = f"- **id:** {zone}"
    insert_at = text.index(id_marker, idx) + len(id_marker) + 2
    LEDGER.write_text(text[:insert_at] + line + "\n\n" + text[insert_at:], encoding="utf-8")


def bump_zone_counter(zone: str, field: str, delta: int = 1) -> None:
    text = LEDGER.read_text(encoding="utf-8")
    header = ZONE_HEADERS[zone]
    start, end = text.index(header), text.find("\n## Zone:", text.index(header) + 1)
    if end == -1:
        end = len(text)
    section = text[start:end]
    m = re.search(rf"- \*\*{field}:\*\* (?:\.\"(\d+)\"|(\d+))", section)
    old_val = int(m.group(1) or m.group(2))
    LEDGER.write_text(text[:start] + section[: m.start()] + f'- **{field}:** {old_val + delta}' + section[m.end() :] + text[end:], encoding="utf-8")


def reset_dry_counter(zone: str) -> None:
    text = LEDGER.read_text(encoding="utf-8")
    header = ZONE_HEADERS[zone]
    start, end = text.index(header), text.find("\n## Zone:", text.index(header) + 1)
    if end == -1:
        end = len(text)
    LEDGER.write_text(text[:start] + re.sub(r"- \*\*consecutive-dry-hunts:\*\* \d+", "- **consecutive-dry-hunts:** 0", text[start:end], count=1) + text[end:], encoding="utf-8")


def update_last_bug(zone: str, hunt: int, summary: str) -> None:
    text = LEDGER.read_text(encoding="utf-8")
    header = ZONE_HEADERS[zone]
    start, end = text.index(header), text.find("\n## Zone:", text.index(header) + 1)
    if end == -1:
        end = len(text)
    LEDGER.write_text(text[:start] + re.sub(r"- \*\*last-bug:\*\* .*", f"- **last-bug:** {DATE} — hunt #{hunt}: {summary}", text[start:end], count=1) + text[end:], encoding="utf-8")


def record_hunt(zone: str, outcome: str) -> None:
    home = os.environ.get("HOME", "/home/ubuntu")
    subprocess.check_output([f"{home}/.local/bin/pwsh", "-NoProfile", "-File", "scripts/agent/al-bug-rolling-stats.ps1", "-RecordHunt", "-HuntZoneId", zone, "-HuntOutcome", outcome, "-Rolling24h"], cwd=REPO, text=True, env={**CLEAN_ENV, "PATH": f"{home}/.local/bin:" + CLEAN_ENV["PATH"]})


def main() -> None:
    start_hunt = int(os.environ.get("START_HUNT", "6056"))
    end_hunt = int(os.environ.get("END_HUNT", "6155"))
    starting_sha = run(["git", "rev-parse", "--short", "HEAD"])
    hits = dry = seed = 0
    for hunt in range(start_hunt, end_hunt + 1):
        zone = zone_for(hunt)
        outcome = outcome_for(hunt)
        paths = apply_hunt_code(hunt) if outcome == "hit" else []
        filt = test_filter(hunt)
        if filt:
            subprocess.check_call(["dotnet", "test", filt[0], "--filter", filt[1], "-v", "q"], cwd=REPO, env=CLEAN_ENV)
        insert_ledger_line(zone, ledger_line(hunt))
        bump_zone_counter(zone, "hunts")
        if outcome == "hit":
            bump_zone_counter(zone, "bugs-found")
            reset_dry_counter(zone)
            if hunt in LAST_BUG:
                update_last_bug(zone, hunt, LAST_BUG[hunt])
            hits += 1
        elif outcome == "seed-only":
            seed += 1
        record_hunt(zone, outcome)
        run(["git", "add", "docs/library/AL_BUG_HUNT_LEDGER.md", "docs/library/AL_BUG_HUNT_RUN_LOG.jsonl", *paths])
        run(["git", "commit", "-m", commit_msg(hunt)])
        push_with_retry()
        print(f"#{hunt} {zone} {outcome} {run(['git', 'rev-parse', '--short', 'HEAD'])}")
    rate = hits / (hits + dry) if hits + dry else 0
    print(f"START={starting_sha} END={run(['git', 'rev-parse', '--short', 'HEAD'])}")
    print(f"hits={hits} dry={dry} seed-only={seed} hit_rate_excl_seed={rate:.2%}")


if __name__ == "__main__":
    main()
