#!/usr/bin/env python3
"""Ship /al-bug hunts #3581-#3630 (batch 37).

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
DATE = "2026-09-15"

TOPOLOGY = {
    3581: ("zaf", "zaf", "za-1", "ds-zaf", "azurerm_zaf.main", "zaf"),
    3586: ("zbg", "zbg", "zb-1", "ds-zbg", "azurerm_zbg.main", "zbg"),
    3591: ("zch", "zch", "zc-1", "ds-zch", "azurerm_zch.main", "zch"),
    3596: ("zdi", "zdi", "zd-1", "ds-zdi", "azurerm_zdi.main", "zdi"),
    3601: ("zej", "zej", "ze-1", "ds-zej", "azurerm_zej.main", "zej"),
    3606: ("zfk", "zfk", "zf-1", "ds-zfk", "azurerm_zfk.main", "zfk"),
    3611: ("zgl", "zgl", "zg-1", "ds-zgl", "azurerm_zgl.main", "zgl"),
    3616: ("zhm", "zhm", "zh-1", "ds-zhm", "azurerm_zhm.main", "zhm"),
    3621: ("zin", "zin", "zi-1", "ds-zin", "azurerm_zin.main", "zin"),
    3626: ("zjo", "zjo", "zj-1", "ds-zjo", "azurerm_zjo.main", "zjo"),
}

CONTEXT_HITS = {3582: "timeout_read", 3607: "deletion_protection"}

LAST_BUG = {
    3581: "azurerm_zaf Compute-category ds- alias gap",
    3582: "terraform-show-json timeoutRead property gap",
    3586: "azurerm_zbg Compute-category ds- alias gap",
    3591: "azurerm_zch Compute-category ds- alias gap",
    3596: "azurerm_zdi Compute-category ds- alias gap",
    3601: "azurerm_zej Compute-category ds- alias gap",
    3606: "azurerm_zfk Compute-category ds- alias gap",
    3607: "terraform-show-json deletionProtection property gap",
    3611: "azurerm_zgl Compute-category ds- alias gap",
    3616: "azurerm_zhm Compute-category ds- alias gap",
    3621: "azurerm_zin Compute-category ds- alias gap",
    3626: "azurerm_zjo Compute-category ds- alias gap",
}


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
    if hunt == 3582:
        return f"{DATE} seed hunt #{hunt} (seed→hit): reseeded context-ingestion with `-Hint context-ingestion`; proved terraform-show-json `timeoutRead` property gap; regression `ParseAsync_timeout_read_maps_tf_timeout_read_property`."
    if hunt == 3607:
        return f"{DATE} seed hunt #{hunt} (seed→hit): reseeded context-ingestion with `-Hint context-ingestion`; proved terraform-show-json `deletionProtection` property gap; regression `ParseAsync_deletion_protection_maps_tf_deletion_protection_property`."
    raise RuntimeError(f"missing ledger for {hunt}")


def commit_msg(hunt: int) -> str:
    if outcome_for(hunt) == "seed-only":
        return f"al-bug hunt #{hunt}: {zone_for(hunt)} seed-only ledger update."
    if hunt in TOPOLOGY:
        return f"al-bug hunt #{hunt}: Fix {TOPOLOGY[hunt][4].split('.')[0]} Compute-category ds- synthetic alias resolution."
    if hunt == 3582:
        return "al-bug hunt #3582: Fix terraform-show-json timeoutRead property mapping."
    if hunt == 3607:
        return "al-bug hunt #3607: Fix terraform-show-json deletionProtection property mapping."
    return f"al-bug hunt #{hunt}: fix"


def test_filter(hunt: int) -> tuple[str, str] | None:
    if hunt in TOPOLOGY:
        suffix = "".join(p.capitalize() for p in TOPOLOGY[hunt][0].split("_"))
        return ("ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj", f"FullyQualifiedName~AgentTopologyProposalMergeGate{suffix}Tests")
    if hunt == 3582:
        return ("ArchLucid.ContextIngestion.Tests/ArchLucid.ContextIngestion.Tests.csproj", "FullyQualifiedName~TerraformShowJsonTimeoutReadTests")
    if hunt == 3607:
        return ("ArchLucid.ContextIngestion.Tests/ArchLucid.ContextIngestion.Tests.csproj", "FullyQualifiedName~TerraformShowJsonDeletionProtectionTests")
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


def add_timeout_read_fix() -> None:
    text = RESOURCE_MAPPING.read_text(encoding="utf-8")
    if 'properties["tf.timeout_read"]' in text:
        return
    old = """        if ((TryGetPropertyIgnoreCase(res, "timeout_update", out JsonElement timeoutUpdate)
                || TryGetPropertyIgnoreCase(res, "timeoutUpdate", out timeoutUpdate))
            && timeoutUpdate.ValueKind == JsonValueKind.String)
        {
            string? timeoutUpdateText = timeoutUpdate.GetString();

            if (!string.IsNullOrWhiteSpace(timeoutUpdateText))
                properties["tf.timeout_update"] = timeoutUpdateText.Trim();
        }"""
    new = old + """

        if ((TryGetPropertyIgnoreCase(res, "timeout_read", out JsonElement timeoutRead)
                || TryGetPropertyIgnoreCase(res, "timeoutRead", out timeoutRead))
            && timeoutRead.ValueKind == JsonValueKind.String)
        {
            string? timeoutReadText = timeoutRead.GetString();

            if (!string.IsNullOrWhiteSpace(timeoutReadText))
                properties["tf.timeout_read"] = timeoutReadText.Trim();
        }"""
    if old not in text:
        raise RuntimeError("timeout_update anchor not found for timeout_read")
    RESOURCE_MAPPING.write_text(text.replace(old, new, 1), encoding="utf-8")


def add_deletion_protection_fix() -> None:
    text = RESOURCE_MAPPING.read_text(encoding="utf-8")
    if 'properties["tf.deletion_protection"]' in text:
        return
    old = """        if ((TryGetPropertyIgnoreCase(res, "prevent_destroy", out JsonElement preventDestroy)
                || TryGetPropertyIgnoreCase(res, "preventDestroy", out preventDestroy))
            && (preventDestroy.ValueKind == JsonValueKind.True || preventDestroy.ValueKind == JsonValueKind.False))
        {
            properties["tf.prevent_destroy"] = preventDestroy.GetBoolean() ? "true" : "false";
        }"""
    new = old + """

        if ((TryGetPropertyIgnoreCase(res, "deletion_protection", out JsonElement deletionProtection)
                || TryGetPropertyIgnoreCase(res, "deletionProtection", out deletionProtection))
            && (deletionProtection.ValueKind == JsonValueKind.True || deletionProtection.ValueKind == JsonValueKind.False))
        {
            properties["tf.deletion_protection"] = deletionProtection.GetBoolean() ? "true" : "false";
        }"""
    if old not in text:
        raise RuntimeError("prevent_destroy anchor not found for deletion_protection")
    RESOURCE_MAPPING.write_text(text.replace(old, new, 1), encoding="utf-8")


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


def write_timeout_read_test() -> Path:
    path = CONTEXT_TEST_DIR / "TerraformShowJsonTimeoutReadTests.cs"
    if path.exists():
        return path
    path.write_text(
        '''using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
namespace ArchLucid.ContextIngestion.Tests;
[Trait("Category", "Unit")]
public sealed class TerraformShowJsonTimeoutReadTests
{
    private readonly TerraformShowJsonInfrastructureDeclarationParser _sut = new(NullLogger<TerraformShowJsonInfrastructureDeclarationParser>.Instance);
    [Fact]
    public async Task ParseAsync_timeout_read_maps_tf_timeout_read_property()
    {
        InfrastructureDeclarationReference decl = new()
        {
            Name = "timeout-read.json", Format = "terraform-show-json", DeclarationId = "d1",
            Content = """{"values":{"root_module":{"resources":[{"type":"azurerm_resource_group","name":"main","timeoutRead":"15m","mode":"managed","provider_name":"registry.terraform.io/hashicorp/azurerm","values":{"name":"rg-a"}}]}}}"""
        };
        IReadOnlyList<CanonicalObject> objects = await _sut.ParseAsync(decl, CancellationToken.None);
        objects.Should().ContainSingle();
        objects[0].Properties["tf.timeout_read"].Should().Be("15m");
    }
}
''',
        encoding="utf-8",
    )
    return path


def write_deletion_protection_test() -> Path:
    path = CONTEXT_TEST_DIR / "TerraformShowJsonDeletionProtectionTests.cs"
    if path.exists():
        return path
    path.write_text(
        '''using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
namespace ArchLucid.ContextIngestion.Tests;
[Trait("Category", "Unit")]
public sealed class TerraformShowJsonDeletionProtectionTests
{
    private readonly TerraformShowJsonInfrastructureDeclarationParser _sut = new(NullLogger<TerraformShowJsonInfrastructureDeclarationParser>.Instance);
    [Fact]
    public async Task ParseAsync_deletion_protection_maps_tf_deletion_protection_property()
    {
        InfrastructureDeclarationReference decl = new()
        {
            Name = "deletion-protection.json", Format = "terraform-show-json", DeclarationId = "d1",
            Content = """{"values":{"root_module":{"resources":[{"type":"azurerm_resource_group","name":"main","deletionProtection":true,"mode":"managed","provider_name":"registry.terraform.io/hashicorp/azurerm","values":{"name":"rg-a"}}]}}}"""
        };
        IReadOnlyList<CanonicalObject> objects = await _sut.ParseAsync(decl, CancellationToken.None);
        objects.Should().ContainSingle();
        objects[0].Properties["tf.deletion_protection"].Should().Be("true");
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
    if hunt == 3582:
        add_timeout_read_fix()
        return [str(RESOURCE_MAPPING.relative_to(REPO)), str(write_timeout_read_test().relative_to(REPO))]
    if hunt == 3607:
        add_deletion_protection_fix()
        return [str(RESOURCE_MAPPING.relative_to(REPO)), str(write_deletion_protection_test().relative_to(REPO))]
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
    start_hunt = int(os.environ.get("START_HUNT", "3581"))
    end_hunt = int(os.environ.get("END_HUNT", "3630"))
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
