using System.Data;

using ArchLucid.Core.Persistence;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>
///     Mutable overlay for post-commit <see cref="ArchLucid.Contracts.Agents.AgentResult" /> enrichments while
///     <c>dbo.AgentResults</c> remains insert-only (TB-303).
/// </summary>
public interface IAgentResultEnrichmentRepository
{
    Task UpsertCalibratedConfidenceAsync(
        string resultId,
        double calibratedConfidence,
        CancellationToken cancellationToken = default);

    Task UpsertEnrichedResultJsonAsync(
        string resultId,
        string enrichedResultJson,
        CancellationToken cancellationToken = default);

    Task MarkEvidenceProposalPromotedAsync(
        string resultId,
        CancellationToken cancellationToken = default,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null);

    Task<IReadOnlyDictionary<string, AgentResultEnrichmentRecord>> GetByResultIdsAsync(
        IReadOnlyCollection<string> resultIds,
        CancellationToken cancellationToken = default);
}
