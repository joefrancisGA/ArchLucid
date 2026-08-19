using System.Collections.Concurrent;
using System.Data;

using ArchLucid.Core.Persistence;

namespace ArchLucid.Persistence.Data.Repositories;

public sealed class InMemoryAgentResultEnrichmentRepository : IAgentResultEnrichmentRepository
{
    private readonly ConcurrentDictionary<string, AgentResultEnrichmentRecord> _rows = new(StringComparer.Ordinal);

    public Task UpsertCalibratedConfidenceAsync(
        string resultId,
        double calibratedConfidence,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(resultId);
        cancellationToken.ThrowIfCancellationRequested();

        _rows.AddOrUpdate(
            resultId,
            _ => new AgentResultEnrichmentRecord
            {
                ResultId = resultId,
                CalibratedConfidence = calibratedConfidence,
                UpdatedUtc = TimeProvider.System.GetUtcNow().UtcDateTime
            },
            (_, existing) => new AgentResultEnrichmentRecord
            {
                ResultId = resultId,
                CalibratedConfidence = calibratedConfidence,
                EnrichedResultJson = existing.EnrichedResultJson,
                EvidenceProposalPromotedUtc = existing.EvidenceProposalPromotedUtc,
                UpdatedUtc = TimeProvider.System.GetUtcNow().UtcDateTime
            });

        return Task.CompletedTask;
    }

    public Task UpsertEnrichedResultJsonAsync(
        string resultId,
        string enrichedResultJson,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(resultId);
        ArgumentException.ThrowIfNullOrWhiteSpace(enrichedResultJson);
        cancellationToken.ThrowIfCancellationRequested();

        _rows.AddOrUpdate(
            resultId,
            _ => new AgentResultEnrichmentRecord
            {
                ResultId = resultId,
                EnrichedResultJson = enrichedResultJson,
                UpdatedUtc = TimeProvider.System.GetUtcNow().UtcDateTime
            },
            (_, existing) => new AgentResultEnrichmentRecord
            {
                ResultId = resultId,
                CalibratedConfidence = existing.CalibratedConfidence,
                EnrichedResultJson = enrichedResultJson,
                EvidenceProposalPromotedUtc = existing.EvidenceProposalPromotedUtc,
                UpdatedUtc = TimeProvider.System.GetUtcNow().UtcDateTime
            });

        return Task.CompletedTask;
    }

    public Task MarkEvidenceProposalPromotedAsync(
        string resultId,
        CancellationToken cancellationToken = default,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(resultId);
        cancellationToken.ThrowIfCancellationRequested();
        _ = connection;
        _ = transaction;

        DateTime promotedUtc = TimeProvider.System.GetUtcNow().UtcDateTime;

        _rows.AddOrUpdate(
            resultId,
            _ => new AgentResultEnrichmentRecord
            {
                ResultId = resultId,
                EvidenceProposalPromotedUtc = promotedUtc,
                UpdatedUtc = promotedUtc
            },
            (_, existing) => new AgentResultEnrichmentRecord
            {
                ResultId = resultId,
                CalibratedConfidence = existing.CalibratedConfidence,
                EnrichedResultJson = existing.EnrichedResultJson,
                EvidenceProposalPromotedUtc = promotedUtc,
                UpdatedUtc = promotedUtc
            });

        return Task.CompletedTask;
    }

    public Task<IReadOnlyDictionary<string, AgentResultEnrichmentRecord>> GetByResultIdsAsync(
        IReadOnlyCollection<string> resultIds,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (resultIds is null || resultIds.Count == 0)
            return Task.FromResult<IReadOnlyDictionary<string, AgentResultEnrichmentRecord>>(
                new Dictionary<string, AgentResultEnrichmentRecord>());

        Dictionary<string, AgentResultEnrichmentRecord> found = new(StringComparer.Ordinal);

        foreach (string resultId in resultIds)
        {
            if (_rows.TryGetValue(resultId, out AgentResultEnrichmentRecord? row))
                found[resultId] = row;
        }

        return Task.FromResult<IReadOnlyDictionary<string, AgentResultEnrichmentRecord>>(found);
    }
}
