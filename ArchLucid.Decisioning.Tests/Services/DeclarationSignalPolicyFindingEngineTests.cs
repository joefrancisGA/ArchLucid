using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.Decisioning.Compliance.Models;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Decisioning.Models;
using ArchLucid.Decisioning.Services;
using ArchLucid.Decisioning.Tests.GoldenCorpus;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Services;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class DeclarationSignalPolicyFindingEngineTests
{
    [Fact]
    public async Task Declaration_security_emits_all_signals_when_pack_has_no_mapped_keys()
    {
        FixedComplianceRulePackProvider provider = new(CreatePack("soc2-001"));
        DeclarationSecurityBaselineFindingEngine sut = new(provider);
        GraphSnapshot graph = CreatePublicAccessAndHttpsDisabledGraph();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, CancellationToken.None);

        findings.Should().HaveCount(2);
        findings.Should().Contain(f => f.Title.Contains("public network access", StringComparison.OrdinalIgnoreCase));
        findings.Should().Contain(f => f.Title.Contains("HTTPS only", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task Declaration_security_with_cis_az_006_only_emits_public_access_not_https()
    {
        FixedComplianceRulePackProvider provider = new(CreatePack("cis-az-006"));
        DeclarationSecurityBaselineFindingEngine sut = new(provider);
        GraphSnapshot graph = CreatePublicAccessAndHttpsDisabledGraph();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, CancellationToken.None);

        findings.Should().ContainSingle();
        findings[0].Title.Should().Contain("public network access", because: "data-protection theme");
        findings[0].PolicyRuleId.Should().Be("cis-az-006");
        findings[0].Trace.RulesApplied.Should().Contain("cis-az-006");
    }

    [Fact]
    public async Task Declaration_security_with_cis_az_025_only_emits_https_not_public_access()
    {
        FixedComplianceRulePackProvider provider = new(CreatePack("cis-az-025"));
        DeclarationSecurityBaselineFindingEngine sut = new(provider);
        GraphSnapshot graph = CreatePublicAccessAndHttpsDisabledGraph();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, CancellationToken.None);

        findings.Should().ContainSingle();
        findings[0].Title.Should().Contain("HTTPS only", because: "transport-security theme");
        findings[0].PolicyRuleId.Should().Be("cis-az-025");
    }

    [Fact]
    public async Task Declaration_security_with_empty_filtered_pack_emits_nothing()
    {
        FixedComplianceRulePackProvider provider = new(CreatePack());
        DeclarationSecurityBaselineFindingEngine sut = new(provider);
        GraphSnapshot graph = CreatePublicAccessAndHttpsDisabledGraph();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, CancellationToken.None);

        findings.Should().BeEmpty();
    }

    [Fact]
    public async Task Premise_conflict_uses_same_policy_gate_as_baseline_engine()
    {
        FixedComplianceRulePackProvider provider = new(CreatePack("cis-az-006"));
        DeclarationPremiseConflictFindingEngine sut = new(provider);
        GraphSnapshot graph = CreatePrivateBaselinePublicDeclarationGraph();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, CancellationToken.None);

        findings.Should().ContainSingle();
        findings[0].PolicyRuleId.Should().Be("cis-az-006");
    }

    [Fact]
    public async Task Premise_conflict_suppressed_when_theme_not_in_filtered_pack()
    {
        FixedComplianceRulePackProvider provider = new(CreatePack("cis-az-025"));
        DeclarationPremiseConflictFindingEngine sut = new(provider);
        GraphSnapshot graph = CreatePrivateBaselinePublicDeclarationGraph();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, CancellationToken.None);

        findings.Should().BeEmpty();
    }

    [Fact]
    public void Declaration_signal_policy_key_map_covers_expected_themes()
    {
        HashSet<string> cis006 = ["cis-az-006"];
        HashSet<string> cis025 = ["cis-az-025"];

        DeclarationSignalPolicyKeyMap.IsThemeEnabled("data-protection", cis006).Should().BeTrue();
        DeclarationSignalPolicyKeyMap.IsThemeEnabled("transport-security", cis006).Should().BeFalse();
        DeclarationSignalPolicyKeyMap.IsThemeEnabled("transport-security", cis025).Should().BeTrue();
        DeclarationSignalPolicyKeyMap.TenantUsesDeclarationVocabulary(cis006).Should().BeTrue();
        DeclarationSignalPolicyKeyMap.TenantUsesDeclarationVocabulary(new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "soc2-001" }).Should().BeFalse();
    }

    private static ComplianceRulePack CreatePack(params string[] ruleIds) =>
        new()
        {
            RulePackId = "test-pack",
            Name = "Test",
            Version = "1",
            Rules = ruleIds
                .Select(
                    static ruleId => new ComplianceRule
                    {
                        RuleId = ruleId,
                        ControlId = "c",
                        ControlName = "n",
                        AppliesToCategory = "cat",
                        RequiredNodeType = "t",
                        RequiredEdgeType = "e",
                        Description = "d",
                    })
                .ToList(),
        };

    private static GraphSnapshot CreatePublicAccessAndHttpsDisabledGraph() => new()
    {
        Nodes =
        [
            new GraphNode
            {
                NodeId = "app-1",
                NodeType = "TopologyResource",
                Label = "api",
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["tf.public_network_access"] = "enabled",
                    ["httpsOnly"] = "false",
                },
            },
        ],
    };

    private static GraphSnapshot CreatePrivateBaselinePublicDeclarationGraph() => new()
    {
        Nodes =
        [
            new GraphNode
            {
                NodeId = "baseline-private",
                NodeType = GraphNodeTypes.SecurityBaseline,
                Label = "Private only network access",
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["description"] = "Private only network access required",
                },
            },
            new GraphNode
            {
                NodeId = "obj-storage",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "docs",
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["tf.public_network_access"] = "enabled",
                },
            },
        ],
        Edges =
        [
            new GraphEdge
            {
                FromNodeId = "baseline-private",
                ToNodeId = "obj-storage",
                EdgeType = GraphEdgeTypes.Protects,
                Weight = 0.9,
            },
        ],
    };
}
