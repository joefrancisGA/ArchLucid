using System.Data;

using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>
///     Persistence interface for commit-sealed <see cref="AgentResult" /> rows (insert-only in SQL; TB-303).
///     Post-commit enrichments use <see cref="IAgentResultEnrichmentRepository" />.
/// </summary>
public interface IAgentResultRepository
{
    Task CreateAsync(
        AgentResult result,
        CancellationToken cancellationToken = default,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null);

    /// <summary>
    ///     Inserts multiple agent results for one run. Duplicate <c>(RunId, TaskId)</c> throws
    ///     <see cref="ArchLucid.Core.Persistence.AgentResultDuplicateConflictException" />.
    /// </summary>
    Task CreateManyAsync(
        IReadOnlyList<AgentResult> results,
        CancellationToken cancellationToken = default,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null);

    Task<IReadOnlyList<AgentResult>> GetByRunIdAsync(
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken = default,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null);

    /// <summary>
    ///     Agent-type markers for a run without deserializing <c>ResultJson</c> (TB-930 buyer-summary grounding).
    /// </summary>
    Task<IReadOnlyList<AgentResult>> GetAgentTypeMarkersByRunIdAsync(
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken = default);

    /// <summary>
    ///     Rollup/compare projection without loading full <c>ResultJson</c> LOBs (TB-2053).
    ///     Populates claims, evidence refs, findings, and proposed-change controls/warnings only.
    /// </summary>
    Task<IReadOnlyList<AgentResult>> GetRollupProjectionByRunIdAsync(
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken = default);

    /// <summary>
    ///     Replaces the persisted <see cref="AgentResult" /> for one run/task pair (quality-gate auto-retry path only).
    /// </summary>
    Task ReplaceForRunTaskAsync(
        AgentResult replacement,
        CancellationToken cancellationToken = default,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null);

    /// <summary>
    ///     Deletes the persisted <see cref="AgentResult" /> for one run/task pair so selective re-execute (TB-938)
    ///     can force that task past TB-039 idempotent skip. No-op when no row exists.
    /// </summary>
    Task DeleteForRunTaskAsync(
        string runId,
        string taskId,
        CancellationToken cancellationToken = default,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null);

    Task<IReadOnlyList<EvidenceProposalListItem>> ListEvidenceProposalsAsync(
        ScopeContext scope,
        CancellationToken cancellationToken = default);

    Task<EvidenceProposalListItem?> TryGetEvidenceProposalAsync(
        ScopeContext scope,
        string resultId,
        CancellationToken cancellationToken = default);
}
