using ArchLucid.Decisioning.Compliance.Models;
using ArchLucid.Decisioning.Models;
using ArchLucid.Decisioning.Services;
using ArchLucid.Decisioning.Tests.GoldenCorpus;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Services;

[Trait("Category", "Unit")]
public sealed class PrivilegedAccessFindingEngineHonestyTests
{
    [Fact]
    public async Task AnalyzeAsync_blank_label_and_both_kind_use_honesty_copy()
    {
        GraphSnapshot snapshot = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "actor-both",
                    NodeType = GraphNodeTypes.Actor,
                    Label = "   ",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["trustOrigin"] = "Internal",
                        ["kind"] = "Both",
                    },
                },
            ],
        };

        PrivilegedAccessFindingEngine sut = new(new FixedComplianceRulePackProvider(CreateFailOpenPack()));

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(snapshot, null, CancellationToken.None);

        findings.Should().ContainSingle();
        findings[0].Title.Should().Contain("kind Both");
        findings[0].Title.Should().Contain("Graph node label was not stored.");
        findings[0].Rationale.Should().Contain("not-stored copy");
        PrivilegedAccessFindingPayload payload = (PrivilegedAccessFindingPayload)findings[0].Payload!;
        payload.ActorLabel.Should().Be("Graph node label was not stored.");
        payload.Kind.Should().Be("Both");
    }

    private static ComplianceRulePack CreateFailOpenPack() =>
        new()
        {
            RulePackId = "actor-security-fail-open",
            Name = "Actor security fail-open",
            Version = "1",
            Rules =
            [
                new ComplianceRule
                {
                    RuleId = "cost-opt-001",
                    ControlId = "c",
                    ControlName = "n",
                    AppliesToCategory = "cat",
                    RequiredNodeType = "t",
                    RequiredEdgeType = "e",
                    Description = "d",
                },
            ],
        };
}
