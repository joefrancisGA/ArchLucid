using ArchLucid.Application.Analysis;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration.Pipeline;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs;

[Trait("Category", "Unit")]
public sealed class AuthorityRunLifecyclePhaseResolverTests
{
    [Fact]
    public void Resolve_when_golden_manifest_id_null_but_stages_succeeded_is_not_complete()
    {
        IReadOnlyList<StageTimelineSummary> stages = SucceededStages();

        AuthorityRunLifecyclePhase phase =
            AuthorityRunLifecyclePhaseResolver.Resolve(null, manifest: null, stages);

        phase.Should().Be(AuthorityRunLifecyclePhase.InProgress);
    }

    [Theory]
    [InlineData(AnalysisStageOutcome.TimedOut)]
    [InlineData(AnalysisStageOutcome.Canceled)]
    [InlineData(AnalysisStageOutcome.RetryExhausted)]
    [InlineData(AnalysisStageOutcome.NotStarted)]
    public void Resolve_when_a_required_stage_ended_without_success_is_failed(string status)
    {
        DateTime started = new(2026, 10, 7, 0, 0, 0, DateTimeKind.Utc);
        IReadOnlyList<StageTimelineSummary> stages =
            [StageTimelineSummary.FromRow("findings", started, started, status)];

        AuthorityRunLifecyclePhaseResolver.Resolve(null, manifest: null, stages)
            .Should().Be(AuthorityRunLifecyclePhase.Failed);
    }

    private static IReadOnlyList<StageTimelineSummary> SucceededStages()
    {
        DateTime started = new(2026, 10, 7, 0, 0, 0, DateTimeKind.Utc);

        return AuthorityPipelineStageNames.Sequence
            .Select(name => StageTimelineSummary.FromRow(
                name,
                started,
                started.AddMinutes(1),
                AuthorityPipelineStageNames.SucceededOutcomeStatus))
            .ToList();
    }
}
