using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Replay;

/// <summary>
///     Commits a replay run after agent execution or authority pipeline completion.
/// </summary>
public interface IReplayRunCommitStage
{
    /// <summary>
    ///     Evaluates, merges, and persists a four-agent replay manifest chain.
    /// </summary>
    Task<ReplayRunResult> CommitFourAgentReplayAsync(
        string preparedReplayRunId,
        string originalRunId,
        string executionMode,
        ArchitectureRequest request,
        ArchitectureRun originalRun,
        IReadOnlyList<AgentResult> results,
        AgentEvidencePackage replayEvidence,
        IReadOnlyList<AgentTask> replayTasks,
        string? manifestVersionOverride,
        CancellationToken cancellationToken = default);

    /// <summary>
    ///     Commits an authority-pipeline replay via the commit orchestrator.
    /// </summary>
    Task<ReplayRunResult> CommitAuthorityReplayAsync(
        string preparedReplayRunId,
        string originalRunId,
        string executionMode,
        CancellationToken cancellationToken = default);
}
