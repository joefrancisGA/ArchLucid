using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Decisioning.Analysis;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class DrRpoQualityAttributeParserTests
{
    [Fact]
    public void TryParseRecoveryObjectives_reads_typed_rto_and_rpo_hours_without_re_parsing_label()
    {
        GraphNode node = new()
        {
            NodeId = "qa-1",
            NodeType = GraphNodeTypes.QualityAttribute,
            Label = "Availability quality attribute",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["theme"] = "availability",
                ["rtoHours"] = "4",
                ["rpoHours"] = "0.25",
                ["sourceQualityAttribute"] = "ignored brief text without parseable tokens",
            },
        };

        bool parsed = DrRpoQualityAttributeParser.TryParseRecoveryObjectives(
            node,
            out int? rpoMinutes,
            out int? rtoMinutes);

        parsed.Should().BeTrue();
        rtoMinutes.Should().Be(240);
        rpoMinutes.Should().Be(15);
    }

    [Fact]
    public void TryParseRecoveryObjectives_returns_false_for_non_quality_attribute_node()
    {
        GraphNode node = new()
        {
            NodeId = "req-1",
            NodeType = GraphNodeTypes.Requirement,
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["rtoHours"] = "4",
            },
        };

        DrRpoQualityAttributeParser.TryParseRecoveryObjectives(node, out int? rpoMinutes, out int? rtoMinutes)
            .Should()
            .BeFalse();

        rpoMinutes.Should().BeNull();
        rtoMinutes.Should().BeNull();
    }
}
