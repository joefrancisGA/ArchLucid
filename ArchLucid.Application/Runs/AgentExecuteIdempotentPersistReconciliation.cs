using System.Data;

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
        IReadOnlyList<AgentResult> persisted =
            await resultRepository.GetByRunIdAsync(scope, runId, cancellationToken, connection, transaction);

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

        AgentEvidencePackage? existing =
            await evidencePackageRepository.GetByRunIdAsync(evidence.RunId, cancellationToken);

        return existing is null;
    }
}
