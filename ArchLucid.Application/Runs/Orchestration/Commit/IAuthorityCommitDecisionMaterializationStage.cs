using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Runs.Orchestration.Commit;

/// <summary>
///     Loads pipeline snapshots, runs decisioning (or manifest reuse), projects the contract, and validates
///     traceability and output integrity for authority commit.
/// </summary>
public interface IAuthorityCommitDecisionMaterializationStage
{
    Task<AuthorityCommitDecisionMaterializationResult> MaterializeAsync(
        ArchitectureRun run,
        Guid runGuid,
        RunRecord runRecord,
        ArchitectureRequest request,
        ScopeContext scope,
        CommitRunRequest? commitOptions,
        CancellationToken cancellationToken);
}
