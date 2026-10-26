using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Persistence.Decisions;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Persistence.ApplicationPorts.Data.Repositories;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Normalizes run id strings on persistence boundaries so list/search filters and stored comparison anchors agree.
/// </summary>
internal static class AnalysisRunIdCanonicalization
{
    public static string CanonicalRunIdForLookup(string runId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        string trimmed = runId.Trim();
        return Guid.TryParse(trimmed, out Guid guid) ? guid.ToString("N") : trimmed;
    }

    public static string CanonicalRunIdForPersistence(string runId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        string trimmed = runId.Trim();
        return Guid.TryParse(trimmed, out Guid guid) ? guid.ToString("N") : trimmed;
    }

    public static string? CanonicalRunIdForPersistenceOrNull(string? runId)
    {
        if (string.IsNullOrWhiteSpace(runId))
            return null;

        return CanonicalRunIdForPersistence(runId);
    }

    public static string? CanonicalRunIdForLookupOrNull(string? runId)
    {
        if (string.IsNullOrWhiteSpace(runId))
            return null;

        return CanonicalRunIdForLookup(runId);
    }

    /// <summary>
    ///     Repository run-id keys to try when hosts store legacy casing (for example uppercase hex on in-memory rows).
    /// </summary>
    internal static IEnumerable<string> EnumerateRunIdRepositoryLookupKeys(string runId)
    {
        string canonical = CanonicalRunIdForLookup(runId);
        yield return canonical;

        if (!Guid.TryParse(canonical, out Guid guid))
            yield break;

        string uppercaseHex = guid.ToString("N").ToUpperInvariant();
        if (!string.Equals(uppercaseHex, canonical, StringComparison.Ordinal))
            yield return uppercaseHex;

        string dashed = guid.ToString("D");
        if (!string.Equals(dashed, canonical, StringComparison.Ordinal))
            yield return dashed;
    }

    internal static async Task<IReadOnlyList<AgentExecutionTrace>> LoadExecutionTracesByRunIdAsync(
        IAgentExecutionTraceRepository traceRepository,
        ScopeContext scope,
        string primaryRunId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(traceRepository);

        foreach (string lookupKey in EnumerateRunIdRepositoryLookupKeys(primaryRunId))
        {
            IReadOnlyList<AgentExecutionTrace> traces = await traceRepository
                .GetByRunIdAsync(scope, lookupKey, cancellationToken)
                .ConfigureAwait(false);

            if (traces is { Count: > 0 })
                return traces;
        }

        return [];
    }

    internal static async Task<IReadOnlyList<AgentExecutionTraceLlmCostSlice>> LoadLlmCostSlicesByRunIdAsync(
        IAgentExecutionTraceRepository traceRepository,
        ScopeContext scope,
        string primaryRunId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(traceRepository);

        foreach (string lookupKey in EnumerateRunIdRepositoryLookupKeys(primaryRunId))
        {
            IReadOnlyList<AgentExecutionTraceLlmCostSlice> slices = await traceRepository
                .GetLlmCostSlicesByRunIdAsync(scope, lookupKey, cancellationToken)
                .ConfigureAwait(false);

            if (slices is { Count: > 0 })
                return slices;
        }

        return [];
    }

    internal static async Task<IReadOnlyList<AgentResult>> LoadAgentTypeMarkersByRunIdAsync(
        IAgentResultRepository resultRepository,
        ScopeContext scope,
        string primaryRunId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(resultRepository);

        foreach (string lookupKey in EnumerateRunIdRepositoryLookupKeys(primaryRunId))
        {
            IReadOnlyList<AgentResult> markers = await resultRepository
                .GetAgentTypeMarkersByRunIdAsync(scope, lookupKey, cancellationToken)
                .ConfigureAwait(false);

            if (markers is { Count: > 0 })
                return markers;
        }

        return [];
    }

    internal static async Task<IReadOnlyList<DecisionNodeRecord>> LoadDecisionNodesByRunIdAsync(
        IDecisionNodeRepository decisionNodeRepository,
        string primaryRunId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(decisionNodeRepository);

        foreach (string lookupKey in EnumerateRunIdRepositoryLookupKeys(primaryRunId))
        {
            IReadOnlyList<DecisionNodeRecord> nodes = await decisionNodeRepository
                .GetByRunIdAsync(lookupKey, cancellationToken)
                .ConfigureAwait(false);

            if (nodes is { Count: > 0 })
                return nodes;
        }

        return [];
    }
}
