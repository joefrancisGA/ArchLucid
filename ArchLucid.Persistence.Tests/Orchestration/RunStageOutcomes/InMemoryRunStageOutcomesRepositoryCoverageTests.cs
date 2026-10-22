using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Persistence.Orchestration.RunStageOutcomes;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Orchestration.RunStageOutcomes;

[Trait("Category", "Unit")]
public sealed class InMemoryRunStageOutcomesRepositoryCoverageTests
{
    [Fact]
    public async Task Repository_records_started_completed_and_lists_timeline()
    {
        InMemoryRunStageOutcomesRepository sut = new();
        Guid runId = Guid.NewGuid();
        DateTime startedUtc = new(2026, 7, 10, 10, 0, 0, DateTimeKind.Utc);
        DateTime completedUtc = startedUtc.AddMinutes(2);

        await sut.RecordStageStartedAsync(runId, "artifacts", startedUtc, CancellationToken.None);
        await sut.RecordStageCompletedAsync(runId, "artifacts", "succeeded", completedUtc, CancellationToken.None);

        IReadOnlyList<StageTimelineSummary> timeline =
            await sut.ListByRunIdAsync(runId, CancellationToken.None);

        timeline.Should().ContainSingle();
        timeline[0].StageName.Should().Be("artifacts");
        timeline[0].OutcomeStatus.Should().Be("succeeded");
        timeline[0].CompletedUtc.Should().Be(completedUtc);
    }

    [Fact]
    public async Task RecordStageCompleted_without_prior_start_creates_completed_row()
    {
        InMemoryRunStageOutcomesRepository sut = new();
        Guid runId = Guid.NewGuid();
        DateTime completedUtc = DateTime.UtcNow;

        await sut.RecordStageCompletedAsync(runId, "decisioning", "skipped", completedUtc, CancellationToken.None);

        IReadOnlyList<StageTimelineSummary> timeline =
            await sut.ListByRunIdAsync(runId, CancellationToken.None);

        timeline.Should().ContainSingle();
        timeline[0].StageName.Should().Be("decisioning");
        timeline[0].StartedUtc.Should().Be(completedUtc);
    }
}
