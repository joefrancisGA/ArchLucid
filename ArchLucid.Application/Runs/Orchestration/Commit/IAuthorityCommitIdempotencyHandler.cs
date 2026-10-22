using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Application.Runs.Orchestration.Commit;

/// <summary>
///     Idempotent replay for runs already committed on the authority path.
/// </summary>
public interface IAuthorityCommitIdempotencyHandler
{
    Task<CommitRunResult?> TryReturnCommittedAsync(
        ArchitectureRun run,
        string runId,
        CancellationToken cancellationToken);
}
