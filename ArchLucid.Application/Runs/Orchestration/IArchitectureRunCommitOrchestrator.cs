using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>
///     Merges agent outputs into a golden manifest and persists commit artifacts (commit phase).
/// </summary>
public interface IArchitectureRunCommitOrchestrator
{
    Task<CommitRunResult> CommitRunAsync(string runId, CancellationToken cancellationToken = default);

    /// <summary>
    ///     Commits a run with optional <see cref="CommitRunRequest.BypassJustification" /> for pre-commit governance.
    /// </summary>
    Task<CommitRunResult> CommitRunAsync(string runId, CommitRunRequest? request, CancellationToken cancellationToken = default);
}
