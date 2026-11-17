using System.Data;

using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Application.Runs;

/// <summary>
///     Reconciles execute-phase agent result writes against insert-only <c>(RunId, TaskId)</c> uniqueness (TB-201 / TB-039).
/// </summary>
internal static class AgentExecuteIdempotentPersistReconciliation
{
    internal static async Task PersistAgentResultsAsync(
        IAgentResultRepository resultRepository,
        ScopeContext scope,
        IReadOnlyList<AgentResult> candidates,
        CancellationToken cancellationToken,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentNullException.ThrowIfNull(resultRepository);
        ArgumentNullException.ThrowIfNull(candidates);

        if (candidates.Count == 0)
            return;

        string runId = candidates[0].RunId;
        IReadOnlyList<AgentResult> persisted = await LoadPersistedAgentResultsForReconcileAsync(
            resultRepository,
            scope,
            runId,
            cancellationToken,
            connection,
            transaction).ConfigureAwait(false);

        IReadOnlyDictionary<string, AgentResult> latestByTaskId =
            AgentExecuteIdempotentResultIndex.BuildLatestByTaskId(persisted);

        List<AgentResult> toCreate = [];

        foreach (AgentResult candidate in candidates)
        {
            latestByTaskId.TryGetValue(candidate.TaskId, out AgentResult? existing);

            if (AgentExecuteIdempotentResultPolicy.ShouldSkipRetry(existing, out _))
                continue;

            if (existing is not null)
            {
                await resultRepository.ReplaceForRunTaskAsync(candidate, cancellationToken, connection, transaction);
                continue;
            }

            toCreate.Add(candidate);
        }

        if (toCreate.Count > 0)
            await resultRepository.CreateManyAsync(toCreate, cancellationToken, connection, transaction);
    }

    internal static async Task<bool> ShouldInsertEvidencePackageAsync(
        IAgentEvidencePackageRepository evidencePackageRepository,
        AgentEvidencePackage evidence,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(evidencePackageRepository);
        ArgumentNullException.ThrowIfNull(evidence);

        string lookupRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(evidence.RunId);
        AgentEvidencePackage? existing = await AnalysisRunIdCanonicalization
            .LoadEvidencePackageByRunIdAsync(evidencePackageRepository, lookupRunId, cancellationToken)
            .ConfigureAwait(false);

        return existing is null;
    }

    private static async Task<IReadOnlyList<AgentResult>> LoadPersistedAgentResultsForReconcileAsync(
        IAgentResultRepository resultRepository,
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        string lookupRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runId);

        if (connection is null && transaction is null)
        {
            return await AnalysisRunIdCanonicalization.LoadAgentResultsByRunIdAsync(
                resultRepository,
                scope,
                lookupRunId,
                useRollupProjection: false,
                cancellationToken).ConfigureAwait(false);
        }

        IReadOnlyList<AgentResult> results = await resultRepository
            .GetByRunIdAsync(scope, lookupRunId, cancellationToken, connection, transaction)
            .ConfigureAwait(false);

        return results ?? [];
    }
}
