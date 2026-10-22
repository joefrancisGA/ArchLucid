using ArchLucid.Api.Evaluation;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.AgentEvaluation;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Evaluation;

[Trait("Suite", "Api")]
[Trait("Category", "Unit")]
public sealed class AgentOutputEvaluationRecordedPerspectiveBuilderTests
{
    [Fact]
    public void TryBuild_returns_null_when_no_recorded_snapshots_exist()
    {
        AgentOutputEvaluationPerspective? perspective =
            AgentOutputEvaluationRecordedPerspectiveBuilder.TryBuild(
                [new AgentExecutionTrace { TraceId = "t1", RunId = "run", TaskId = "task", AgentType = AgentType.Topology }],
                [new AgentOutputEvaluationScore { TraceId = "t1", AgentType = AgentType.Topology }],
                0);

        perspective.Should().BeNull();
    }

    [Fact]
    public void TryBuild_uses_persisted_outcome_even_when_advisory_scores_would_reject()
    {
        AgentExecutionTrace trace = new()
        {
            TraceId = "t1",
            RunId = "run",
            TaskId = "task",
            AgentType = AgentType.Topology,
            ParseSucceeded = true,
            ParsedResultJson = "{}",
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Accepted,
            QualityGateDefinitionVersion = "config-abc",
            QualityGateDefinitionContentHashSha256 = "a".PadRight(64, 'a'),
            QualityGateDefinitionMode = "WarnOnly",
        };

        AgentOutputEvaluationScore advisory = new()
        {
            TraceId = "t1",
            AgentType = AgentType.Topology,
            StructuralCompletenessRatio = 0.2,
            Semantic = new AgentOutputSemanticScore
            {
                TraceId = "t1",
                AgentType = AgentType.Topology,
                OverallSemanticScore = 0.2,
            },
            QualityGateOutcome = AgentOutputQualityGateOutcome.Rejected,
        };

        AgentOutputEvaluationPerspective? perspective =
            AgentOutputEvaluationRecordedPerspectiveBuilder.TryBuild([trace], [advisory], 0);

        perspective.Should().NotBeNull();
        perspective!.Authority.Should().Be(AgentOutputEvaluationPerspectiveMapper.RecordedAuthority);
        perspective.AggregateQualityGateOutcome.Should().Be(AgentOutputQualityGateOutcome.Accepted);
        perspective.Scores.Single().QualityGateOutcome.Should().Be(AgentOutputQualityGateOutcome.Accepted);
    }
}
