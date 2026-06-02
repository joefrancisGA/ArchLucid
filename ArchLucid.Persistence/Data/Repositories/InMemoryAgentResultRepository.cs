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
public sealed class InMemoryAgentResultRepository : IAgentResultRepository
{
    private readonly Lock _gate = new();
    private readonly List<AgentResult> _results = [];
    private readonly HashSet<string> _promotedProposalResultIds = new(StringComparer.Ordinal);

    /// <inheritdoc />
    public Task CreateAsync(
        AgentResult result,
        CancellationToken cancellationToken = default,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentNullException.ThrowIfNull(result);
        cancellationToken.ThrowIfCancellationRequested();
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

    /// <inheritdoc />
    public Task CreateManyAsync(
        IReadOnlyList<AgentResult> results,
        CancellationToken cancellationToken = default,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentNullException.ThrowIfNull(results);
        cancellationToken.ThrowIfCancellationRequested();
        if (results.Count == 0)
            return Task.CompletedTask;

        List<string> distinctRunIds = results.Select(r => r.RunId).Distinct().ToList();
        if (distinctRunIds.Count > 1)

            throw new ArgumentException(
                $"All results in a batch must belong to the same run. Found distinct RunIds: {string.Join(", ", distinctRunIds)}.",
                nameof(results));

        string runId = distinctRunIds[0];
        lock (_gate)
        {
            _results.RemoveAll(r => string.Equals(r.RunId, runId, StringComparison.Ordinal));
            foreach (AgentResult r in results)

                _results.Add(Clone(r));
        }

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<AgentResult>> GetByRunIdAsync(
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken = default,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        _ = scope;
        cancellationToken.ThrowIfCancellationRequested();
        lock (_gate)
        {
            List<AgentResult> list = _results
                .Where(r => string.Equals(r.RunId, runId, StringComparison.Ordinal))
                .OrderBy(r => r.CreatedUtc)
                .Select(Clone)
                .ToList();

            return Task.FromResult<IReadOnlyList<AgentResult>>(list);
        }
    }

    private static AgentResult Clone(AgentResult source)
    {
        string json = JsonSerializer.Serialize(source, ContractJson.Default);
        AgentResult? copy = JsonSerializer.Deserialize<AgentResult>(json, ContractJson.Default);

        return copy ?? throw new InvalidOperationException("Clone produced null AgentResult.");
    }

    public Task PatchCalibratedConfidenceAsync(
        string resultId,
        double calibratedConfidence,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        lock (_gate)
        {
            AgentResult? row = _results.FirstOrDefault(r => r.ResultId == resultId);

            if (row is not null)
                row.CalibratedConfidence = calibratedConfidence;
        }

        return Task.CompletedTask;
    }

    public Task PatchProposedEvidenceJsonAsync(
        string resultId,
        string proposedEvidenceJson,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        lock (_gate)
        {
            AgentResult? row = _results.FirstOrDefault(r => r.ResultId == resultId);

            if (row is not null)
                row.ProposedEvidenceJson = proposedEvidenceJson;
        }

        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<EvidenceProposalListItem>> ListEvidenceProposalsAsync(
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        lock (_gate)
        {
            List<EvidenceProposalListItem> items = _results
                .Where(r => !string.IsNullOrWhiteSpace(r.ProposedEvidenceJson))
                .OrderByDescending(r => r.CreatedUtc)
                .Select(r => new EvidenceProposalListItem
                {
                    ResultId = r.ResultId,
                    RunId = r.RunId,
                    AgentType = r.AgentType.ToString(),
                    ProposedEvidenceJson = r.ProposedEvidenceJson!,
                    CreatedUtc = r.CreatedUtc,
                    IsPromoted = _promotedProposalResultIds.Contains(r.ResultId)
                })
                .ToList();

            return Task.FromResult<IReadOnlyList<EvidenceProposalListItem>>(items);
        }
    }

    public Task<EvidenceProposalListItem?> TryGetEvidenceProposalAsync(
        string resultId,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        lock (_gate)
        {
            AgentResult? row = _results.FirstOrDefault(r => r.ResultId == resultId);

            if (row is null || string.IsNullOrWhiteSpace(row.ProposedEvidenceJson))
                return Task.FromResult<EvidenceProposalListItem?>(null);

            return Task.FromResult<EvidenceProposalListItem?>(new EvidenceProposalListItem
            {
                ResultId = row.ResultId,
                RunId = row.RunId,
                AgentType = row.AgentType.ToString(),
                ProposedEvidenceJson = row.ProposedEvidenceJson!,
                CreatedUtc = row.CreatedUtc,
                IsPromoted = _promotedProposalResultIds.Contains(row.ResultId)
            });
        }
    }

    public Task MarkEvidenceProposalPromotedAsync(string resultId, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        lock (_gate)
        {
            _promotedProposalResultIds.Add(resultId);
        }

        return Task.CompletedTask;
    }
}
