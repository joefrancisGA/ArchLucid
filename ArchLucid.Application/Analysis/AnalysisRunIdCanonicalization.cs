using System.Data;
using System.Globalization;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Persistence.Decisions;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
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

    internal static bool RunIdsReferToSameRun(string leftRunId, string rightRunId)
    {
        if (string.Equals(leftRunId, rightRunId, StringComparison.Ordinal))
            return true;

        if (Guid.TryParse(leftRunId, out Guid leftGuid) && Guid.TryParse(rightRunId, out Guid rightGuid))
            return leftGuid == rightGuid;

        return false;
    }

    internal static bool AgentResultsAppearAnchoredToRun(IReadOnlyList<AgentResult> results, string expectedRunId)
    {
        if (results is not { Count: > 0 })
            return false;

        foreach (AgentResult result in results)
        {
            if (result is null)
                return false;

            if (string.IsNullOrWhiteSpace(result.RunId))
                return false;

            if (!RunIdsReferToSameRun(result.RunId, expectedRunId))
                return false;
        }

        return true;
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

        string dashedUpper = guid.ToString("D").ToUpperInvariant();
        if (!string.Equals(dashedUpper, dashed, StringComparison.Ordinal)
            && !string.Equals(dashedUpper, canonical, StringComparison.Ordinal))
            yield return dashedUpper;

        string braced = guid.ToString("B");
        if (!string.Equals(braced, canonical, StringComparison.Ordinal)
            && !string.Equals(braced, dashed, StringComparison.Ordinal))
            yield return braced;

        string bracedUpper = braced.ToUpperInvariant();
        if (!string.Equals(bracedUpper, braced, StringComparison.Ordinal))
            yield return bracedUpper;

        string parentheses = guid.ToString("P");
        if (!string.Equals(parentheses, canonical, StringComparison.Ordinal)
            && !string.Equals(parentheses, dashed, StringComparison.Ordinal)
            && !string.Equals(parentheses, braced, StringComparison.Ordinal))
            yield return parentheses;

        string parenthesesUpper = parentheses.ToUpperInvariant();
        if (!string.Equals(parenthesesUpper, parentheses, StringComparison.Ordinal))
            yield return parenthesesUpper;
    }

    internal static async Task<IReadOnlyList<AgentResult>> ResolveAgentResultsForCompareReadAsync(
        IAgentResultRepository resultRepository,
        ScopeContext scope,
        IReadOnlyList<AgentResult> hydratedResults,
        string runId,
        bool useRollupProjection,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<AgentResult> loaded = await LoadAgentResultsByRunIdAsync(
            resultRepository,
            scope,
            runId,
            useRollupProjection,
            cancellationToken).ConfigureAwait(false);

        // Repository rows win; fall back to already-hydrated detail results when the store is empty.
        if (loaded.Count > 0)
            return loaded;

        return hydratedResults ?? [];
    }

    internal static async Task<IReadOnlyList<AgentResult>> LoadAgentResultsByRunIdAsync(
        IAgentResultRepository resultRepository,
        ScopeContext scope,
        string primaryRunId,
        bool useRollupProjection,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(resultRepository);

        string lookupRunId = CanonicalRunIdForLookup(primaryRunId);

        IReadOnlyList<AgentResult> results = useRollupProjection
            ? await resultRepository
                .GetRollupProjectionByRunIdAsync(scope, lookupRunId, cancellationToken)
                .ConfigureAwait(false)
            : await resultRepository
                .GetByRunIdAsync(scope, lookupRunId, cancellationToken)
                .ConfigureAwait(false);

        return results ?? [];
    }

    internal static async Task<IReadOnlyList<AgentResult>> LoadAgentResultsByRunIdAsync(
        IAgentResultRepository resultRepository,
        ScopeContext scope,
        string primaryRunId,
        bool useRollupProjection,
        CancellationToken cancellationToken,
        IDbConnection? connection,
        IDbTransaction? transaction)
    {
        if (connection is null && transaction is null)
        {
            return await LoadAgentResultsByRunIdAsync(
                resultRepository,
                scope,
                primaryRunId,
                useRollupProjection,
                cancellationToken).ConfigureAwait(false);
        }

        ArgumentNullException.ThrowIfNull(resultRepository);

        string lookupRunId = CanonicalRunIdForLookup(primaryRunId);

        IReadOnlyList<AgentResult> results = await resultRepository
            .GetByRunIdAsync(scope, lookupRunId, cancellationToken, connection, transaction)
            .ConfigureAwait(false);

        return results ?? [];
    }

    internal static async Task<IReadOnlyList<AgentTask>> LoadAgentTasksByRunIdAsync(
        IAgentTaskRepository taskRepository,
        ScopeContext scope,
        string primaryRunId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(taskRepository);

        string lookupRunId = CanonicalRunIdForLookup(primaryRunId);

        IReadOnlyList<AgentTask> tasks = await taskRepository
            .GetByRunIdAsync(scope, lookupRunId, cancellationToken)
            .ConfigureAwait(false);

        return tasks ?? [];
    }

    internal static async Task<IReadOnlyList<TechnologyLedgerEntry>> LoadTechnologyLedgerEntriesByRunIdAsync(
        ITechnologyLedgerRepository technologyLedgerRepository,
        ScopeContext scope,
        string primaryRunId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(technologyLedgerRepository);

        string lookupRunId = CanonicalRunIdForLookup(primaryRunId);

        IReadOnlyList<TechnologyLedgerEntry> entries = await technologyLedgerRepository
            .GetByRunIdAsync(scope, lookupRunId, cancellationToken)
            .ConfigureAwait(false);

        return entries ?? [];
    }

    internal static async Task<IReadOnlyList<AgentExecutionTrace>> LoadExecutionTracesByRunIdAsync(
        IAgentExecutionTraceRepository traceRepository,
        ScopeContext scope,
        string primaryRunId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(traceRepository);

        string lookupRunId = CanonicalRunIdForLookup(primaryRunId);

        IReadOnlyList<AgentExecutionTrace> traces = await traceRepository
            .GetByRunIdAsync(scope, lookupRunId, cancellationToken)
            .ConfigureAwait(false);

        if (traces is not { Count: > 0 })
            return [];

        return traces
            .OrderBy(static trace => trace.CreatedUtc)
            .ThenBy(static trace => trace.TraceId, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    internal static async Task<IReadOnlyList<AgentExecutionTraceLlmCostSlice>> LoadLlmCostSlicesByRunIdAsync(
        IAgentExecutionTraceRepository traceRepository,
        ScopeContext scope,
        string primaryRunId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(traceRepository);

        string lookupRunId = CanonicalRunIdForLookup(primaryRunId);

        IReadOnlyList<AgentExecutionTraceLlmCostSlice> slices = await traceRepository
            .GetLlmCostSlicesByRunIdAsync(scope, lookupRunId, cancellationToken)
            .ConfigureAwait(false);

        return slices ?? [];
    }

    internal static async Task<IReadOnlyList<AgentResult>> LoadAgentTypeMarkersByRunIdAsync(
        IAgentResultRepository resultRepository,
        ScopeContext scope,
        string primaryRunId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(resultRepository);

        string lookupRunId = CanonicalRunIdForLookup(primaryRunId);

        IReadOnlyList<AgentResult> markers = await resultRepository
            .GetAgentTypeMarkersByRunIdAsync(scope, lookupRunId, cancellationToken)
            .ConfigureAwait(false);

        return markers ?? [];
    }

    internal static async Task<AgentEvidencePackage?> LoadEvidencePackageByRunIdAsync(
        IAgentEvidencePackageRepository evidencePackageRepository,
        string primaryRunId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(evidencePackageRepository);

        string lookupRunId = CanonicalRunIdForLookup(primaryRunId);

        return await evidencePackageRepository
            .GetByRunIdAsync(lookupRunId, cancellationToken)
            .ConfigureAwait(false);
    }

    internal static async Task<IReadOnlyList<DecisionNodeRecord>> LoadDecisionNodesByRunIdAsync(
        IDecisionNodeRepository decisionNodeRepository,
        string primaryRunId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(decisionNodeRepository);

        string lookupRunId = CanonicalRunIdForLookup(primaryRunId);

        IReadOnlyList<DecisionNodeRecord> nodes = await decisionNodeRepository
            .GetByRunIdAsync(lookupRunId, cancellationToken)
            .ConfigureAwait(false);

        return nodes ?? [];
    }

    internal static async Task<IReadOnlyList<RunExportRecord>> LoadRunExportRecordsByRunIdAsync(
        IRunExportRecordRepository runExportRecordRepository,
        string primaryRunId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(runExportRecordRepository);

        string lookupRunId = CanonicalRunIdForLookup(primaryRunId);

        IReadOnlyList<RunExportRecord> records = await runExportRecordRepository
            .GetByRunIdAsync(lookupRunId, cancellationToken)
            .ConfigureAwait(false);

        return records ?? [];
    }

    internal static async Task<IReadOnlyList<ComparisonRecord>> LoadComparisonRecordsByRunIdAsync(
        IComparisonRecordRepository comparisonRecordRepository,
        string primaryRunId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(comparisonRecordRepository);

        string lookupRunId = CanonicalRunIdForLookup(primaryRunId);

        IReadOnlyList<ComparisonRecord> records = await comparisonRecordRepository
            .GetByRunIdAsync(lookupRunId, cancellationToken)
            .ConfigureAwait(false);

        return records ?? [];
    }

    internal static async Task<IReadOnlyList<GovernancePromotionRecord>> LoadGovernancePromotionRecordsByRunIdAsync(
        IGovernancePromotionRecordRepository promotionRecordRepository,
        string primaryRunId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(promotionRecordRepository);

        string lookupRunId = CanonicalRunIdForLookup(primaryRunId);

        IReadOnlyList<GovernancePromotionRecord> records = await promotionRecordRepository
            .GetByRunIdAsync(lookupRunId, cancellationToken)
            .ConfigureAwait(false);

        return records ?? [];
    }

    internal static async Task<IReadOnlyList<GovernanceApprovalRequest>> LoadGovernanceApprovalRequestsByRunIdAsync(
        IGovernanceApprovalRequestRepository approvalRequestRepository,
        string primaryRunId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(approvalRequestRepository);

        string lookupRunId = CanonicalRunIdForLookup(primaryRunId);

        IReadOnlyList<GovernanceApprovalRequest> records = await approvalRequestRepository
            .GetByRunIdAsync(lookupRunId, cancellationToken)
            .ConfigureAwait(false);

        return records ?? [];
    }

    internal static async Task<IReadOnlyList<GovernanceEnvironmentActivation>> LoadGovernanceEnvironmentActivationsByRunIdAsync(
        IGovernanceEnvironmentActivationRepository environmentActivationRepository,
        string primaryRunId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(environmentActivationRepository);

        string lookupRunId = CanonicalRunIdForLookup(primaryRunId);

        IReadOnlyList<GovernanceEnvironmentActivation> records = await environmentActivationRepository
            .GetByRunIdAsync(lookupRunId, cancellationToken)
            .ConfigureAwait(false);

        return records ?? [];
    }
}
