using System.Data;
using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Persistence;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>
///     Thread-safe in-memory <see cref="IAgentResultRepository" /> for tests (clone-on-read for isolation).
/// </summary>
public sealed class InMemoryAgentResultRepository(IAgentResultEnrichmentRepository agentResultEnrichmentRepository)
    : IAgentResultRepository
{
    private readonly IAgentResultEnrichmentRepository _agentResultEnrichmentRepository =
        agentResultEnrichmentRepository ?? throw new ArgumentNullException(nameof(agentResultEnrichmentRepository));

    private readonly Lock _gate = new();
    private readonly List<AgentResult> _results = [];

    public Task CreateAsync(
        AgentResult result,
        CancellationToken cancellationToken = default,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentNullException.ThrowIfNull(result);
        cancellationToken.ThrowIfCancellationRequested();
        _ = connection;
        _ = transaction;

        lock (_gate)
        {
            if (_results.Any(r =>
                    string.Equals(r.RunId, result.RunId, StringComparison.Ordinal) &&
                    string.Equals(r.TaskId, result.TaskId, StringComparison.Ordinal)))
            {
                throw new AgentResultDuplicateConflictException(result.RunId, result.TaskId);
            }

            _results.Add(Clone(result));
        }

        return Task.CompletedTask;
    }

    public async Task CreateManyAsync(
        IReadOnlyList<AgentResult> results,
        CancellationToken cancellationToken = default,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentNullException.ThrowIfNull(results);
        cancellationToken.ThrowIfCancellationRequested();
        _ = connection;
        _ = transaction;

        foreach (AgentResult result in results)
            await CreateAsync(result, cancellationToken).ConfigureAwait(false);
    }

    public Task ReplaceForRunTaskAsync(
        AgentResult replacement,
        CancellationToken cancellationToken = default,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentNullException.ThrowIfNull(replacement);
        cancellationToken.ThrowIfCancellationRequested();
        _ = connection;
        _ = transaction;

        lock (_gate)
        {
            _results.RemoveAll(r =>
                string.Equals(r.RunId, replacement.RunId, StringComparison.Ordinal) &&
                string.Equals(r.TaskId, replacement.TaskId, StringComparison.Ordinal));

            _results.Add(Clone(replacement));
        }

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task DeleteForRunTaskAsync(
        string runId,
        string taskId,
        CancellationToken cancellationToken = default,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentException.ThrowIfNullOrWhiteSpace(taskId);
        cancellationToken.ThrowIfCancellationRequested();
        _ = connection;
        _ = transaction;

        lock (_gate)
        {
            _results.RemoveAll(r =>
                string.Equals(r.RunId, runId, StringComparison.Ordinal) &&
                string.Equals(r.TaskId, taskId, StringComparison.Ordinal));
        }

        return Task.CompletedTask;
    }

    public async Task<IReadOnlyList<AgentResult>> GetByRunIdAsync(
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken = default,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        _ = scope;
        cancellationToken.ThrowIfCancellationRequested();
        _ = connection;
        _ = transaction;

        List<AgentResult> list;
        lock (_gate)
        {
            list = _results
                .Where(r => string.Equals(r.RunId, runId, StringComparison.Ordinal))
                .OrderBy(r => r.CreatedUtc)
                .Select(Clone)
                .ToList();
        }

        IReadOnlyDictionary<string, AgentResultEnrichmentRecord> enrichments =
            await _agentResultEnrichmentRepository.GetByResultIdsAsync(
                list.Select(static r => r.ResultId).ToList(),
                cancellationToken).ConfigureAwait(false);

        return AgentResultEnrichmentMerger.Apply(list, enrichments);
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<AgentResult>> GetAgentTypeMarkersByRunIdAsync(
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        _ = scope;

        lock (_gate)
        {
            List<AgentResult> markers = _results
                .Where(r => string.Equals(r.RunId, runId, StringComparison.Ordinal))
                .OrderBy(r => r.CreatedUtc)
                .Select(static r => new AgentResult
                {
                    ResultId = r.ResultId,
                    TaskId = r.TaskId,
                    RunId = r.RunId,
                    AgentType = r.AgentType,
                    Confidence = r.Confidence,
                    CreatedUtc = r.CreatedUtc,
                })
                .ToList();

            return Task.FromResult<IReadOnlyList<AgentResult>>(markers);
        }
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<AgentResult>> GetRollupProjectionByRunIdAsync(
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        _ = scope;

        List<AgentResult> projected;
        lock (_gate)
        {
            projected = _results
                .Where(r => string.Equals(r.RunId, runId, StringComparison.Ordinal))
                .OrderBy(r => r.CreatedUtc)
                .Select(static r => AgentResultRollupProjection.StripHeavyFields(Clone(r)))
                .ToList();
        }

        IReadOnlyDictionary<string, AgentResultEnrichmentRecord> enrichments =
            await _agentResultEnrichmentRepository.GetByResultIdsAsync(
                projected.Select(static r => r.ResultId).ToList(),
                cancellationToken).ConfigureAwait(false);

        if (enrichments.Count == 0)
            return projected;

        List<AgentResult> merged = [];

        foreach (AgentResult baseResult in projected)
        {
            if (!enrichments.TryGetValue(baseResult.ResultId, out AgentResultEnrichmentRecord? enrichment))
            {
                merged.Add(baseResult);
                continue;
            }

            if (!string.IsNullOrWhiteSpace(enrichment.EnrichedResultJson))
            {
                AgentResult? enriched = JsonSerializer.Deserialize<AgentResult>(
                    enrichment.EnrichedResultJson,
                    ContractJson.Default);

                if (enriched is not null)
                {
                    merged.Add(AgentResultRollupProjection.StripHeavyFields(enriched));
                    continue;
                }
            }

            if (enrichment.CalibratedConfidence.HasValue)
                baseResult.CalibratedConfidence = enrichment.CalibratedConfidence;

            merged.Add(baseResult);
        }

        return merged;
    }

    public async Task<IReadOnlyList<EvidenceProposalListItem>> ListEvidenceProposalsAsync(
        ScopeContext scope,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        _ = scope;

        List<EvidenceProposalListItem> items = [];
        List<AgentResult> snapshot;

        lock (_gate)
        {
            snapshot = _results
                .Where(r => !string.IsNullOrWhiteSpace(r.ProposedEvidenceJson))
                .Select(Clone)
                .ToList();
        }

        foreach (AgentResult row in snapshot)
        {
            if (await IsPromotedAsync(row.ResultId, cancellationToken).ConfigureAwait(false))
                continue;

            items.Add(new EvidenceProposalListItem
            {
                ResultId = row.ResultId,
                RunId = row.RunId,
                AgentType = row.AgentType.ToString(),
                ProposedEvidenceJson = row.ProposedEvidenceJson!,
                CreatedUtc = row.CreatedUtc,
                IsPromoted = false
            });
        }

        return items.OrderByDescending(static i => i.CreatedUtc).ToList();
    }

    public async Task<EvidenceProposalListItem?> TryGetEvidenceProposalAsync(
        ScopeContext scope,
        string resultId,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        _ = scope;

        AgentResult? row;
        lock (_gate)
        {
            row = _results.FirstOrDefault(r => r.ResultId == resultId);
        }

        if (row is null || string.IsNullOrWhiteSpace(row.ProposedEvidenceJson))
            return null;

        bool isPromoted = await IsPromotedAsync(resultId, cancellationToken).ConfigureAwait(false);

        return new EvidenceProposalListItem
        {
            ResultId = row.ResultId,
            RunId = row.RunId,
            AgentType = row.AgentType.ToString(),
            ProposedEvidenceJson = row.ProposedEvidenceJson!,
            CreatedUtc = row.CreatedUtc,
            IsPromoted = isPromoted
        };
    }

    private async Task<bool> IsPromotedAsync(string resultId, CancellationToken cancellationToken)
    {
        IReadOnlyDictionary<string, AgentResultEnrichmentRecord> enrichments =
            await _agentResultEnrichmentRepository.GetByResultIdsAsync([resultId], cancellationToken).ConfigureAwait(false);

        if (enrichments.TryGetValue(resultId, out AgentResultEnrichmentRecord? enrichment)
            && enrichment.EvidenceProposalPromotedUtc.HasValue)
            return true;

        return false;
    }

    private static AgentResult Clone(AgentResult source)
    {
        string json = JsonSerializer.Serialize(source, ContractJson.Default);
        AgentResult? copy = JsonSerializer.Deserialize<AgentResult>(json, ContractJson.Default);

        return copy ?? throw new InvalidOperationException("Clone produced null AgentResult.");
    }
}
