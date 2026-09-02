using ArchLucid.Application.Runs.Orchestration.Pipeline;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Runs;

namespace ArchLucid.Application.Runs;

/// <summary>
///     Maps authority stage outcomes to <see cref="AuthorityRunLifecyclePhase" /> without overloading agent-task status.
/// </summary>
public static class AuthorityRunLifecyclePhaseResolver
{
    public static AuthorityRunLifecyclePhase Resolve(
        Guid? goldenManifestId,
        GoldenManifest? manifest,
        IReadOnlyList<StageTimelineSummary>? stageOutcomes)
    {
        if (RunKernelCompleteness.IsAuthorityPipelineComplete(goldenManifestId, manifest, stageOutcomes))
            return AuthorityRunLifecyclePhase.Complete;

        IReadOnlyList<StageTimelineSummary> stages = stageOutcomes ?? [];

        if (stages.Count == 0)
            return AuthorityRunLifecyclePhase.NotStarted;

        Dictionary<string, StageTimelineSummary> latestByName = stages
            .GroupBy(static stage => stage.StageName, StringComparer.Ordinal)
            .ToDictionary(
                static group => group.Key,
                static group => group.Last(),
                StringComparer.Ordinal);

        bool anyFailed = AuthorityPipelineStageNames.Sequence.Any(stageName =>
            latestByName.TryGetValue(stageName, out StageTimelineSummary? row)
            && string.Equals(row.OutcomeStatus, "failed", StringComparison.Ordinal));

        if (anyFailed)
            return AuthorityRunLifecyclePhase.Failed;

        bool anyStarted = latestByName.Count > 0;

        return anyStarted
            ? AuthorityRunLifecyclePhase.InProgress
            : AuthorityRunLifecyclePhase.NotStarted;
    }
}
