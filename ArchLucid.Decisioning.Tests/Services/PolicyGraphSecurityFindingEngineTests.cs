using ArchLucid.Decisioning.Compliance.Models;
using ArchLucid.Decisioning.Models;
using ArchLucid.Decisioning.Services;
using ArchLucid.Decisioning.Tests.GoldenCorpus;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Services;

[Trait("Suite", "Core")]
public sealed class PolicyGraphSecurityFindingEngineTests
{
    [Fact]
    public async Task ExternalExposure_fail_open_when_pack_has_unmapped_prefix()
    {
        ExternalExposureFindingEngine sut = new(new FixedComplianceRulePackProvider(CreatePack("cost-opt-001")));
        GraphSnapshot graph = CreateExternalActorGraph();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, null, CancellationToken.None);

        findings.Should().ContainSingle();
        findings[0].PolicyRuleId.Should().BeNull();
    }

    [Fact]
    public async Task ExternalExposure_suppressed_when_soc2_001_only()
    {
        ExternalExposureFindingEngine sut = new(new FixedComplianceRulePackProvider(CreatePack("soc2-001")));
        GraphSnapshot graph = CreateExternalActorGraph();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, null, CancellationToken.None);

        findings.Should().BeEmpty();
    }

    [Fact]
    public async Task ExternalExposure_emits_with_soc2_018_network_isolation_rule()
    {
        ExternalExposureFindingEngine sut = new(new FixedComplianceRulePackProvider(CreatePack("soc2-018")));
        GraphSnapshot graph = CreateExternalActorGraph();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, null, CancellationToken.None);

        Finding finding = findings.Should().ContainSingle().Subject;
        finding.PolicyRuleId.Should().Be("soc2-018");
        finding.Trace.RulesApplied.Should().Contain("network-isolation");
    }

    [Fact]
    public async Task PrivilegedAccess_suppressed_when_soc2_018_only()
    {
        PrivilegedAccessFindingEngine sut = new(new FixedComplianceRulePackProvider(CreatePack("soc2-018")));
        GraphSnapshot graph = CreateInternalHumanActorGraph();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, null, CancellationToken.None);

        findings.Should().BeEmpty();
    }

    [Fact]
    public async Task PrivilegedAccess_emits_with_aks_workload_isolation_rule()
    {
        PrivilegedAccessFindingEngine sut = new(new FixedComplianceRulePackProvider(CreatePack("aks-021")));
        GraphSnapshot graph = CreateInternalHumanActorGraph();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, null, CancellationToken.None);

        Finding finding = findings.Should().ContainSingle().Subject;
        finding.PolicyRuleId.Should().Be("aks-021");
        finding.Trace.RulesApplied.Should().Contain("workload-isolation");
    }

    [Fact]
    public async Task ExternalExposure_suppressed_when_pack_is_empty()
    {
        ExternalExposureFindingEngine sut = new(new FixedComplianceRulePackProvider(CreatePack()));
        GraphSnapshot graph = CreateExternalActorGraph();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, null, CancellationToken.None);

        findings.Should().BeEmpty();
    }

    private static GraphSnapshot CreateExternalActorGraph() => new()
    {
        Nodes =
        [
            new GraphNode
            {
                NodeId = "actor-external",
                NodeType = GraphNodeTypes.Actor,
                Label = "customer",
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["trustOrigin"] = "External",
                    ["kind"] = "Human",
                },
            },
        ],
    };

    private static GraphSnapshot CreateInternalHumanActorGraph() => new()
    {
        Nodes =
        [
            new GraphNode
            {
                NodeId = "actor-internal",
                NodeType = GraphNodeTypes.Actor,
                Label = "admin",
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["trustOrigin"] = "Internal",
                    ["kind"] = "Human",
                },
            },
        ],
    };

    private static ComplianceRulePack CreatePack(params string[] ruleIds) =>
        new()
        {
            RulePackId = "graph-security-policy-test",
            Name = "Graph security policy test",
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
}
