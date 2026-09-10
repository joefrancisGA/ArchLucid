using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Risk;
using ArchLucid.Decisioning.Risk;
using ArchLucid.KnowledgeGraph.WafTradeoff;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Risk;

[Trait("Category", "Unit")]
public sealed class TradeoffAcknowledgmentResolverTests
{
    [Fact]
    public void ResolveAcknowledgmentAnswerKey_returns_null_when_answer_contains_unacceptable()
    {
        WafTradeoffCatalogEntry catalogEntry = new WafTradeoffCatalog().All
            .Single(entry => entry.MechanismKey == "cost-performance/scale-to-zero");

        TransparencyTrail trail = new()
        {
            Asserted =
            [
                new AssertedTrailEntry
                {
                    Key = "answer.l0.pillar.cost",
                    Value = "This latency tradeoff is unacceptable",
                },
            ],
        };

        string? answerKey = TradeoffAcknowledgmentResolver.ResolveAcknowledgmentAnswerKey(trail, catalogEntry);

        answerKey.Should().BeNull();
    }

    [Fact]
    public void ResolveAcknowledgmentAnswerKey_returns_key_when_answer_is_acceptable()
    {
        WafTradeoffCatalogEntry catalogEntry = new WafTradeoffCatalog().All
            .Single(entry => entry.MechanismKey == "cost-performance/scale-to-zero");

        TransparencyTrail trail = new()
        {
            Asserted =
            [
                new AssertedTrailEntry
                {
                    Key = "answer.l0.pillar.cost",
                    Value = "scale-to-zero consumption plan is acceptable",
                },
            ],
        };

        string? answerKey = TradeoffAcknowledgmentResolver.ResolveAcknowledgmentAnswerKey(trail, catalogEntry);

        answerKey.Should().Be("answer.l0.pillar.cost");
    }
}
