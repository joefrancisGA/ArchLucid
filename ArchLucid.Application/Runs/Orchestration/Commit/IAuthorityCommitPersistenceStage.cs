using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Runs;
using ArchLucid.Decisioning.Decisions;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Runs.Orchestration.Commit;

/// <summary>
///     Persists the committed manifest chain and runs post-commit hooks (audit, telemetry, projections).
/// </summary>
public interface IAuthorityCommitPersistenceStage
{
    Task<CommitRunResult> FinalizeAndCompleteAsync(
        ArchitectureRun run,
        string runId,
        Guid runGuid,
        RunRecord runRecord,
        ArchitectureRequest request,
        string actor,
        ReadyForCommitRun readyForCommitRun,
        AuthorityCommitDecisionMaterializationResult materialization,
        CancellationToken cancellationToken);
}
