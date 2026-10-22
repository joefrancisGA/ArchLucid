using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.QualityGates;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Data.Repositories;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AgentExecutionTraceQueryPatchCoreTests
{
    [Fact]
    public void ClampPageLimit_clamps_to_maximum()
    {
        AgentExecutionTraceQueryPatchCore.ClampPageLimit(10_000)
            .Should()
            .Be(AgentExecutionTraceQueryPatchCore.MaxPageSize);
    }

    [Fact]
    public void NormalizeRunIds_trims_and_deduplicates()
    {
        List<string> normalized = AgentExecutionTraceQueryPatchCore.NormalizeRunIds(
            [" run-a ", "run-a", "", "run-b"]);

        normalized.Should().Equal("run-a", "run-b");
    }

    [Fact]
    public void ToLlmCostSlice_maps_token_columns()
    {
        AgentExecutionTraceLlmCostSlice slice = AgentExecutionTraceQueryPatchCore.ToLlmCostSlice(new AgentExecutionTrace
        {
            ModelDeploymentName = "gpt",
            InputTokenCount = 10,
            OutputTokenCount = 20,
            ReasoningTokenCount = 5,
        });

        slice.ModelDeploymentName.Should().Be("gpt");
        slice.InputTokenCount.Should().Be(10);
        slice.OutputTokenCount.Should().Be(20);
        slice.ReasoningTokenCount.Should().Be(5);
    }

    [Fact]
    public void PageInMemory_returns_window_and_total()
    {
        (IReadOnlyList<int> page, int total) = AgentExecutionTraceQueryPatchCore.PageInMemory(
            [1, 2, 3, 4, 5],
            offset: 1,
            limit: 2);

        total.Should().Be(5);
        page.Should().Equal(2, 3);
    }

    [Fact]
    public void TryApplyQualityGateRecordedSnapshotPatch_is_first_outcome_wins()
    {
        AgentExecutionTrace trace = new()
        {
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Accepted,
        };

        bool applied = AgentExecutionTraceQueryPatchCore.TryApplyQualityGateRecordedSnapshotPatch(
            trace,
            AgentOutputQualityGateOutcome.Rejected,
            "v1",
            "hash",
            "strict",
            evaluationSnapshot: null);

        applied.Should().BeFalse();
        trace.QualityRejected.Should().BeFalse();
    }

    [Fact]
    public void TryApplyQualityGateRecordedSnapshotPatch_applies_evaluation_snapshot()
    {
        AgentExecutionTrace trace = new();

        bool applied = AgentExecutionTraceQueryPatchCore.TryApplyQualityGateRecordedSnapshotPatch(
            trace,
            AgentOutputQualityGateOutcome.Warned,
            "v1",
            "hash",
            "strict",
            new QualityGateRecordedEvaluationSnapshot
            {
                StructuralCompletenessRatio = 0.8,
                SemanticScore = 0.7,
            });

        applied.Should().BeTrue();
        trace.QualityWarning.Should().BeTrue();
        trace.RecordedStructuralCompletenessRatio.Should().Be(0.8);
    }
}
