using ArchLucid.AgentRuntime.Evaluation;
using ArchLucid.Api.Evaluation;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;

using FluentAssertions;

using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AgentOutputEvaluationWorstGateAggregatorTests
{
    [Fact]
    public void WorstOutcome_returns_null_when_no_semantic_rows()
    {
        AgentOutputQualityGate gate =
            new(Options.Create(new AgentOutputQualityGateOptions()));

        AgentOutputEvaluationScore onlyStructural = new()
        {
            TraceId = "t0",
            AgentType = AgentType.Topology,
            StructuralCompletenessRatio = 0.9,
            IsJsonParseFailure = false,
        };

        AgentOutputEvaluationWorstGateAggregator.WorstOutcome([onlyStructural], gate).Should().BeNull();
    }

    [Fact]
    public void WorstOutcome_returns_null_when_all_parse_failures()
    {
        AgentOutputQualityGate gate =
            new(Options.Create(new AgentOutputQualityGateOptions()));

        AgentOutputEvaluationScore bad = new()
        {
            TraceId = "t-bad",
            AgentType = AgentType.Topology,
            IsJsonParseFailure = true,
            Semantic = new AgentOutputSemanticScore
            {
                TraceId = "t-bad",
                AgentType = AgentType.Topology,
                OverallSemanticScore = 0.9,
            },
        };

        AgentOutputEvaluationWorstGateAggregator.WorstOutcome([bad], gate).Should().BeNull();
    }

    [Fact]
    public void WorstOutcome_prefers_rejected_over_warned()
    {
        AgentOutputQualityGate gate =
            new(Options.Create(new AgentOutputQualityGateOptions()));

        AgentOutputEvaluationScore warned = new()
        {
            TraceId = "t-warn",
            AgentType = AgentType.Topology,
            StructuralCompletenessRatio = 0.84,
            IsJsonParseFailure = false,
            Semantic = new AgentOutputSemanticScore
            {
                TraceId = "t-warn",
                AgentType = AgentType.Topology,
                OverallSemanticScore = 0.64,
            },
        };

        AgentOutputEvaluationScore rejected = new()
        {
            TraceId = "t-rej",
            AgentType = AgentType.Topology,
            StructuralCompletenessRatio = 0.69,
            IsJsonParseFailure = false,
            Semantic = new AgentOutputSemanticScore
            {
                TraceId = "t-rej",
                AgentType = AgentType.Topology,
                OverallSemanticScore = 0.49,
            },
        };

        AgentOutputQualityGateOutcome? worst =
            AgentOutputEvaluationWorstGateAggregator.WorstOutcome([warned, rejected], gate);

        worst.Should().Be(AgentOutputQualityGateOutcome.Rejected);
    }
}
