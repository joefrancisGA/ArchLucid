using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Decisioning.Compliance.Evaluators;
using ArchLucid.Decisioning.Compliance.Loaders;
using ArchLucid.Decisioning.Compliance.Models;
using ArchLucid.Decisioning.Models;
using ArchLucid.Decisioning.Services;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.GoldenCorpus;

/// <summary>End-to-end regression for <see cref="ComplianceRulePackGovernanceFilter" /> via compliance findings.</summary>
[Trait("Suite", "Core")]
public sealed class PolicyFilteredGoldenCorpusTests
{
    private const string StorageRuleId = "storage-must-have-policy-applicability";
    private const string NetworkRuleId = "network-must-have-security-baseline";

    [Fact]
    public async Task Policy_filtered_postures_emit_different_compliance_findings()
    {
        string rulesPath = Path.Combine(
            AppContext.BaseDirectory,
            "Compliance",
            "RulePacks",
            "default-compliance.rules.json");

        File.Exists(rulesPath).Should().BeTrue();

        FileComplianceRulePackLoader loader = new(rulesPath);
        ComplianceRulePack fullPack = await loader.LoadAsync(CancellationToken.None);
        ArchLucid.Contracts.Compliance.ComplianceRulePack contractFullPack =
            (ArchLucid.Contracts.Compliance.ComplianceRulePack)fullPack;

        GraphSnapshot graph = CreateNetworkAndStorageTopologyGraph();

        PolicyPackContentDocument storageOnlyPosture = new()
        {
            ComplianceRuleKeys = [StorageRuleId],
        };

        PolicyPackContentDocument networkOnlyPosture = new()
        {
            ComplianceRuleKeys = [NetworkRuleId],
        };

        ComplianceRulePack storageFiltered =
            (ComplianceRulePack)ComplianceRulePackGovernanceFilter.Filter(contractFullPack, storageOnlyPosture);
        ComplianceRulePack networkFiltered =
            (ComplianceRulePack)ComplianceRulePackGovernanceFilter.Filter(contractFullPack, networkOnlyPosture);

        storageFiltered.Rules.Count.Should().BeLessThan(fullPack.Rules.Count);
        networkFiltered.Rules.Count.Should().BeLessThan(fullPack.Rules.Count);
        storageFiltered.Rules.Should().ContainSingle(r => r.RuleId == StorageRuleId);
        networkFiltered.Rules.Should().ContainSingle(r => r.RuleId == NetworkRuleId);

        IReadOnlyList<Finding> storageFindings = await RunComplianceEngineAsync(storageFiltered, graph);
        IReadOnlyList<Finding> networkFindings = await RunComplianceEngineAsync(networkFiltered, graph);

        storageFindings.Should().ContainSingle();
        networkFindings.Should().ContainSingle();

        ExtractRuleIds(storageFindings).Should().ContainSingle(StorageRuleId);
        ExtractRuleIds(networkFindings).Should().ContainSingle(NetworkRuleId);

        ExtractRuleIds(storageFindings).Should().NotContain(NetworkRuleId);
        ExtractRuleIds(networkFindings).Should().NotContain(StorageRuleId);
    }

    [Fact]
    public async Task Policy_filter_identity_would_not_narrow_rule_pack()
    {
        string rulesPath = Path.Combine(
            AppContext.BaseDirectory,
            "Compliance",
            "RulePacks",
            "default-compliance.rules.json");

        FileComplianceRulePackLoader loader = new(rulesPath);
        ComplianceRulePack fullPack = await loader.LoadAsync(CancellationToken.None);
        ArchLucid.Contracts.Compliance.ComplianceRulePack contractFullPack =
            (ArchLucid.Contracts.Compliance.ComplianceRulePack)fullPack;

        PolicyPackContentDocument storageOnlyPosture = new()
        {
            ComplianceRuleKeys = [StorageRuleId],
        };

        ComplianceRulePack filtered =
            (ComplianceRulePack)ComplianceRulePackGovernanceFilter.Filter(contractFullPack, storageOnlyPosture);

        filtered.Rules.Count.Should().BeLessThan(fullPack.Rules.Count);
    }

    private static GraphSnapshot CreateNetworkAndStorageTopologyGraph() => new()
    {
        GraphSnapshotId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeee01"),
        ContextSnapshotId = Guid.Parse("bbbbbbbb-cccc-dddd-eeee-ffffffff0001"),
        RunId = Guid.Parse("cccccccc-dddd-eeee-ffff-000000000001"),
        CreatedUtc = new DateTime(2026, 2, 1, 0, 0, 0, DateTimeKind.Utc),
        Nodes =
        [
            new GraphNode
            {
                NodeId = "net-1",
                NodeType = "TopologyResource",
                Label = "hub-vnet",
                Category = "network",
                Properties = new Dictionary<string, string>(),
            },
            new GraphNode
            {
                NodeId = "stor-1",
                NodeType = "TopologyResource",
                Label = "ledger-archive",
                Category = "storage",
                Properties = new Dictionary<string, string>(),
            },
        ],
        Edges = [],
        Warnings = [],
    };

    private static async Task<IReadOnlyList<Finding>> RunComplianceEngineAsync(
        ComplianceRulePack filteredPack,
        GraphSnapshot graph)
    {
        FixedComplianceRulePackProvider provider = new(filteredPack);
        ComplianceRulePackValidator validator = new();
        GraphComplianceEvaluator evaluator = new();
        ComplianceFindingEngine engine = new(provider, validator, evaluator);

        return await engine.AnalyzeAsync(graph, CancellationToken.None);
    }

    private static HashSet<string> ExtractRuleIds(IReadOnlyList<Finding> findings)
    {
        HashSet<string> ruleIds = new(StringComparer.OrdinalIgnoreCase);

        foreach (Finding finding in findings)
        {
            if (finding.Payload is ComplianceFindingPayload payload && !string.IsNullOrWhiteSpace(payload.RuleId))
                ruleIds.Add(payload.RuleId);

            foreach (string rule in finding.Trace.RulesApplied)
            {
                if (!string.IsNullOrWhiteSpace(rule))
                    ruleIds.Add(rule);
            }
        }

        return ruleIds;
    }
}
