using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;

using FluentAssertions;

using Xunit;

namespace ArchLucid.Core.Tests.Findings;

public sealed class EngineInsightNoveltyRateAggregationTests
{
    [Fact]
    public void BuildRows_computes_rate_per_engine_type()
    {
        Guid runId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        List<EngineInsightNoveltyRateAggregation.DecisionGradeEmission> emissions =
        [
            new(runId, "f-1", "security-baseline"),
            new(runId, "f-2", "security-baseline"),
            new(runId, "f-3", "requirement"),
        ];
        List<EngineInsightNoveltyRateAggregation.NoveltySignalRef> signals =
        [
            new(runId, "f-1"),
        ];

        IReadOnlyList<EngineInsightNoveltyRateRow> rows =
            EngineInsightNoveltyRateAggregation.BuildRows(emissions, signals);

        rows.Should().HaveCount(2);
        rows.Should().Contain(row =>
            row.EngineType == "requirement"
            && row.DecisionGradeCount == 1
            && row.DidNotThinkOfThatCount == 0
            && row.Rate == 0);
        rows.Should().Contain(row =>
            row.EngineType == "security-baseline"
            && row.DecisionGradeCount == 2
            && row.DidNotThinkOfThatCount == 1
            && row.Rate == 0.5);
    }
}
