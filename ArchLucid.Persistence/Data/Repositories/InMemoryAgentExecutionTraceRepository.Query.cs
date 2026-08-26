using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Data.Repositories;

public sealed partial class InMemoryAgentExecutionTraceRepository
{
    /// <inheritdoc />
    public Task<AgentExecutionTrace?> GetByTraceIdAsync(string traceId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(traceId);
        cancellationToken.ThrowIfCancellationRequested();

        lock (_gate)
        {
            AgentExecutionTrace? found = _items.FirstOrDefault(t =>
                string.Equals(t.TraceId, traceId, StringComparison.Ordinal));

            return Task.FromResult(found is null ? null : Clone(found));
        }
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<AgentExecutionTrace>> GetByRunIdAsync(
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken = default)
    {
        _ = scope;
        cancellationToken.ThrowIfCancellationRequested();
        lock (_gate)
        {
            List<AgentExecutionTrace> list = _items
                .Where(t => string.Equals(t.RunId, runId, StringComparison.Ordinal))
                .OrderBy(t => t.CreatedUtc)
                .Select(Clone)
                .ToList();

            return Task.FromResult<IReadOnlyList<AgentExecutionTrace>>(list);
        }
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<AgentExecutionTraceLlmCostSlice>> GetLlmCostSlicesByRunIdAsync(
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken = default)
    {
        _ = scope;
        cancellationToken.ThrowIfCancellationRequested();
        lock (_gate)
        {
            List<AgentExecutionTraceLlmCostSlice> list = _items
                .Where(t => string.Equals(t.RunId, runId, StringComparison.Ordinal))
                .OrderBy(t => t.CreatedUtc)
                .Select(static t => new AgentExecutionTraceLlmCostSlice
                {
                    ModelDeploymentName = t.ModelDeploymentName,
                    InputTokenCount = t.InputTokenCount,
                    OutputTokenCount = t.OutputTokenCount,
                    ReasoningTokenCount = t.ReasoningTokenCount,
                })
                .ToList();

            return Task.FromResult<IReadOnlyList<AgentExecutionTraceLlmCostSlice>>(list);
        }
    }

    /// <inheritdoc />
    public Task<IReadOnlyDictionary<string, IReadOnlyList<AgentExecutionTraceLlmCostSlice>>> GetLlmCostSlicesByRunIdsAsync(
        ScopeContext scope,
        IReadOnlyCollection<string> runIds,
        CancellationToken cancellationToken = default)
    {
        _ = scope;
        cancellationToken.ThrowIfCancellationRequested();
        ArgumentNullException.ThrowIfNull(runIds);

        List<string> normalized = runIds
            .Where(static s => !string.IsNullOrWhiteSpace(s))
            .Select(static s => s.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        lock (_gate)
        {
            Dictionary<string, IReadOnlyList<AgentExecutionTraceLlmCostSlice>> result =
                new(StringComparer.OrdinalIgnoreCase);

            foreach (string runId in normalized)
            {
                List<AgentExecutionTraceLlmCostSlice> list = _items
                    .Where(t => string.Equals(t.RunId, runId, StringComparison.Ordinal))
                    .OrderBy(t => t.CreatedUtc)
                    .Select(static t => new AgentExecutionTraceLlmCostSlice
                    {
                        ModelDeploymentName = t.ModelDeploymentName,
                        InputTokenCount = t.InputTokenCount,
                        OutputTokenCount = t.OutputTokenCount,
                        ReasoningTokenCount = t.ReasoningTokenCount,
                    })
                    .ToList();

                result[runId] = list;
            }

            return Task.FromResult<IReadOnlyDictionary<string, IReadOnlyList<AgentExecutionTraceLlmCostSlice>>>(result);
        }
    }

    /// <inheritdoc />
    public Task<(IReadOnlyList<AgentExecutionTrace> Traces, int TotalCount)> GetPagedByRunIdAsync(
        ScopeContext scope,
        string runId,
        int offset,
        int limit,
        CancellationToken cancellationToken = default)
    {
        _ = scope;
        cancellationToken.ThrowIfCancellationRequested();
        lock (_gate)
        {
            List<AgentExecutionTrace> ordered = _items
                .Where(t => string.Equals(t.RunId, runId, StringComparison.Ordinal))
                .OrderBy(t => t.CreatedUtc)
                .ToList();

            int total = ordered.Count;
            int clampedOffset = Math.Max(0, offset);
            int clampedLimit = Math.Clamp(limit, 1, 500);
            List<AgentExecutionTrace> page = ordered
                .Skip(clampedOffset)
                .Take(clampedLimit)
                .Select(Clone)
                .ToList();

            return Task.FromResult<(IReadOnlyList<AgentExecutionTrace>, int)>((page, total));
        }
    }

    /// <inheritdoc />
    public Task<(IReadOnlyList<AgentExecutionTraceSummary> Summaries, int TotalCount)> GetPagedSummariesByRunIdAsync(
        ScopeContext scope,
        string runId,
        int offset,
        int limit,
        CancellationToken cancellationToken = default)
    {
        _ = scope;
        cancellationToken.ThrowIfCancellationRequested();
        lock (_gate)
        {
            List<AgentExecutionTrace> ordered = _items
                .Where(t => string.Equals(t.RunId, runId, StringComparison.Ordinal))
                .OrderBy(t => t.CreatedUtc)
                .ToList();

            int total = ordered.Count;
            int clampedOffset = Math.Max(0, offset);
            int clampedLimit = Math.Clamp(limit, 1, 500);
            List<AgentExecutionTraceSummary> page = ordered
                .Skip(clampedOffset)
                .Take(clampedLimit)
                .Select(AgentExecutionTraceSummary.FromTrace)
                .ToList();

            return Task.FromResult<(IReadOnlyList<AgentExecutionTraceSummary>, int)>((page, total));
        }
    }

    /// <inheritdoc />
    public Task<int> CountByRunIdAsync(
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken = default)
    {
        _ = scope;
        cancellationToken.ThrowIfCancellationRequested();
        lock (_gate)
        {
            int total = _items.Count(t => string.Equals(t.RunId, runId, StringComparison.Ordinal));

            return Task.FromResult(total);
        }
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<AgentExecutionTrace>> GetByTaskIdAsync(string taskId,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        lock (_gate)
        {
            List<AgentExecutionTrace> list = _items
                .Where(t => string.Equals(t.TaskId, taskId, StringComparison.Ordinal))
                .OrderBy(t => t.CreatedUtc)
                .Select(Clone)
                .ToList();

            return Task.FromResult<IReadOnlyList<AgentExecutionTrace>>(list);
        }
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<string>> GetDistinctAgentTypesWithLlmResourceFallbackAsync(
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken = default)
    {
        _ = scope;
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        cancellationToken.ThrowIfCancellationRequested();

        lock (_gate)
        {
            List<AgentExecutionTrace> forRun = _items
                .Where(t => string.Equals(t.RunId, runId.Trim(), StringComparison.Ordinal))
                .ToList();

            return Task.FromResult(AgentExecutionTraceDegradationProbe.DistinctOrderedAgentTypeNames(forRun));
        }
    }

    /// <inheritdoc />
    public Task<IReadOnlyDictionary<string, IReadOnlyList<string>>> GetDistinctAgentTypesWithLlmResourceFallbackByRunIdsAsync(
        ScopeContext scope,
        IReadOnlyList<string> runIds,
        CancellationToken cancellationToken = default)
    {
        _ = scope;
        ArgumentNullException.ThrowIfNull(runIds);
        cancellationToken.ThrowIfCancellationRequested();

        List<string> normalized = runIds
            .Where(static s => !string.IsNullOrWhiteSpace(s))
            .Select(static s => s.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        lock (_gate)
        {
            Dictionary<string, IReadOnlyList<string>> map = new(StringComparer.OrdinalIgnoreCase);

            foreach (string rid in normalized)
            {
                List<AgentExecutionTrace> forRun = _items
                    .Where(t => string.Equals(t.RunId, rid, StringComparison.Ordinal))
                    .ToList();

                map[rid] = AgentExecutionTraceDegradationProbe.DistinctOrderedAgentTypeNames(forRun);
            }

            return Task.FromResult<IReadOnlyDictionary<string, IReadOnlyList<string>>>(map);
        }
    }
}
