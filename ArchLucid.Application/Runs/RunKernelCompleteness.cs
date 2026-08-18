using ArchLucid.Application.Runs.Orchestration.Pipeline;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Runs;

namespace ArchLucid.Application.Runs;

/// <summary>
///     Two independent completeness predicates for a run (EK-07).
///     <see cref="ArchitectureRunStatus" /> numeric values stay unchanged; these flags are computed from
///     existing headers, stage outcomes, and agent results.
/// </summary>
public static class RunKernelCompleteness
{
    /// <summary>
    ///     Agent-task loop is complete when status is <see cref="ArchitectureRunStatus.ReadyForCommit" />
    ///     and <see cref="IRunStateTransitionService.HasCommitReadyAgentResults" /> is true for
    ///     Topology, Cost, Compliance, and Critic.
    /// </summary>
    public static bool IsAgentTaskLoopComplete(
        IRunStateTransitionService transitions,
        ArchitectureRunStatus status,
        IReadOnlyList<AgentResult>? results)
    {
        ArgumentNullException.ThrowIfNull(transitions);

        if (status is not ArchitectureRunStatus.ReadyForCommit)
            return false;

        IReadOnlyList<AgentResult> safeResults = results ?? [];

        return transitions.HasCommitReadyAgentResults(safeResults);
    }

    /// <summary>
    ///     Authority pipeline is complete when every
    ///     <see cref="AuthorityPipelineStageNames.Sequence" /> stage succeeded in
    ///     <c>RunStageOutcomes</c> and a golden manifest pointer is present
    ///     (<c>GoldenManifestId</c> or loaded <see cref="GoldenManifest" /> not null — the same
    ///     pointer rules as GET <c>/v1/architecture/review/{runId}</c>).
    /// </summary>
    public static bool IsAuthorityPipelineComplete(
        Guid? goldenManifestId,
        GoldenManifest? manifest,
        IReadOnlyList<StageTimelineSummary>? stageOutcomes)
    {
        if (!HasGoldenManifestPointer(goldenManifestId, manifest))
            return false;

        IReadOnlyList<StageTimelineSummary> stages = stageOutcomes ?? [];
        Dictionary<string, StageTimelineSummary> latestByName = stages
            .GroupBy(static stage => stage.StageName, StringComparer.Ordinal)
            .ToDictionary(
                static group => group.Key,
                static group => group.Last(),
                StringComparer.Ordinal);

        return AuthorityPipelineStageNames.Sequence.All(stageName =>
            latestByName.TryGetValue(stageName, out StageTimelineSummary? row)
            && string.Equals(row.OutcomeStatus, AuthorityPipelineStageNames.SucceededOutcomeStatus, StringComparison.Ordinal));
    }

    /// <summary>
    ///     Golden pointer is present when the run header has a <c>GoldenManifestId</c>
    ///     or GET run-detail already resolved a <see cref="GoldenManifest" />.
    /// </summary>
    public static bool HasGoldenManifestPointer(Guid? goldenManifestId, GoldenManifest? manifest)
    {
        if (manifest is not null)
            return true;

        return goldenManifestId is { } id && id != Guid.Empty;
    }
}
