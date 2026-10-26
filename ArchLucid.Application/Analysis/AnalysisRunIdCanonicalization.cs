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
        return await LoadAgentResultsByRunIdAsync(
            resultRepository,
            scope,
            runId,
            useRollupProjection,
            cancellationToken).ConfigureAwait(false);
    }

    internal static async Task<IReadOnlyList<AgentResult>> LoadAgentResultsByRunIdAsync(
        IAgentResultRepository resultRepository,
        ScopeContext scope,
        string primaryRunId,
        bool useRollupProjection,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(resultRepository);

        Dictionary<string, AgentResult> merged = new(StringComparer.OrdinalIgnoreCase);

        foreach (string lookupKey in EnumerateRunIdRepositoryLookupKeys(primaryRunId))
        {
            IReadOnlyList<AgentResult> results = useRollupProjection
                ? await resultRepository
                    .GetRollupProjectionByRunIdAsync(scope, lookupKey, cancellationToken)
                    .ConfigureAwait(false)
                : await resultRepository
                    .GetByRunIdAsync(scope, lookupKey, cancellationToken)
                    .ConfigureAwait(false);

            if (results is not { Count: > 0 })
                continue;

            foreach (AgentResult result in results)
            {
                if (result is null)
                    continue;

                string mergeKey = string.IsNullOrWhiteSpace(result.ResultId)
                    ? $"{result.AgentType}:{result.TaskId}"
                    : result.ResultId;

                PreferNewerByCreatedUtc(merged, mergeKey, result, static r => r.CreatedUtc);
            }
        }

        return merged.Count == 0
            ? []
            : merged.Values
                .OrderByDescending(static result => result.CreatedUtc)
                .ThenBy(static result => result.ResultId, StringComparer.OrdinalIgnoreCase)
                .ToList();
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

        Dictionary<string, AgentResult> merged = new(StringComparer.OrdinalIgnoreCase);

        foreach (string lookupKey in EnumerateRunIdRepositoryLookupKeys(primaryRunId))
        {
            IReadOnlyList<AgentResult> results = await resultRepository
                .GetByRunIdAsync(scope, lookupKey, cancellationToken, connection, transaction)
                .ConfigureAwait(false);

            if (results is not { Count: > 0 })
                continue;

            foreach (AgentResult result in results)
            {
                if (result is null)
                    continue;

                string mergeKey = string.IsNullOrWhiteSpace(result.ResultId)
                    ? $"{result.AgentType}:{result.TaskId}"
                    : result.ResultId;

                PreferNewerByCreatedUtc(merged, mergeKey, result, static r => r.CreatedUtc);
            }
        }

        return merged.Count == 0
            ? []
            : merged.Values
                .OrderByDescending(static result => result.CreatedUtc)
                .ThenBy(static result => result.ResultId, StringComparer.OrdinalIgnoreCase)
                .ToList();
    }

    internal static async Task<IReadOnlyList<AgentTask>> LoadAgentTasksByRunIdAsync(
        IAgentTaskRepository taskRepository,
        ScopeContext scope,
        string primaryRunId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(taskRepository);

        Dictionary<string, AgentTask> merged = new(StringComparer.OrdinalIgnoreCase);

        foreach (string lookupKey in EnumerateRunIdRepositoryLookupKeys(primaryRunId))
        {
            IReadOnlyList<AgentTask> tasks = await taskRepository
                .GetByRunIdAsync(scope, lookupKey, cancellationToken)
                .ConfigureAwait(false);

            if (tasks is not { Count: > 0 })
                continue;

            foreach (AgentTask task in tasks)
            {
                if (task is null || string.IsNullOrWhiteSpace(task.TaskId))
                    continue;

                PreferNewerByCreatedUtc(merged, task.TaskId, task, static t => t.CreatedUtc);
            }
        }

        return merged.Count == 0
            ? []
            : merged.Values
                .OrderByDescending(static task => task.CreatedUtc)
                .ThenBy(static task => task.TaskId, StringComparer.OrdinalIgnoreCase)
                .ToList();
    }

    internal static async Task<IReadOnlyList<TechnologyLedgerEntry>> LoadTechnologyLedgerEntriesByRunIdAsync(
        ITechnologyLedgerRepository technologyLedgerRepository,
        ScopeContext scope,
        string primaryRunId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(technologyLedgerRepository);

        Dictionary<string, TechnologyLedgerEntry> merged = new(StringComparer.OrdinalIgnoreCase);

        foreach (string lookupKey in EnumerateRunIdRepositoryLookupKeys(primaryRunId))
        {
            IReadOnlyList<TechnologyLedgerEntry> entries = await technologyLedgerRepository
                .GetByRunIdAsync(scope, lookupKey, cancellationToken)
                .ConfigureAwait(false);

            if (entries is not { Count: > 0 })
                continue;

            foreach (TechnologyLedgerEntry entry in entries)
            {
                if (entry is null || string.IsNullOrWhiteSpace(entry.EntryId))
                    continue;

                PreferNewerByCreatedUtc(merged, entry.EntryId, entry, static e => e.CreatedUtc);
            }
        }

        return merged.Count == 0
            ? []
            : merged.Values
                .OrderByDescending(static entry => entry.CreatedUtc)
                .ThenBy(static entry => entry.EntryId, StringComparer.OrdinalIgnoreCase)
                .ToList();
    }

    internal static async Task<IReadOnlyList<AgentExecutionTrace>> LoadExecutionTracesByRunIdAsync(
        IAgentExecutionTraceRepository traceRepository,
        ScopeContext scope,
        string primaryRunId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(traceRepository);

        Dictionary<string, AgentExecutionTrace> merged = new(StringComparer.OrdinalIgnoreCase);

        foreach (string lookupKey in EnumerateRunIdRepositoryLookupKeys(primaryRunId))
        {
            IReadOnlyList<AgentExecutionTrace> traces = await traceRepository
                .GetByRunIdAsync(scope, lookupKey, cancellationToken)
                .ConfigureAwait(false);

            if (traces is not { Count: > 0 })
                continue;

            foreach (AgentExecutionTrace trace in traces)
            {
                if (trace is null || string.IsNullOrWhiteSpace(trace.TraceId))
                    continue;

                PreferNewerByCreatedUtc(merged, trace.TraceId, trace, static t => t.CreatedUtc);
            }
        }

        return merged.Count == 0 ? [] : merged.Values.ToList();
    }

    internal static async Task<IReadOnlyList<AgentExecutionTraceLlmCostSlice>> LoadLlmCostSlicesByRunIdAsync(
        IAgentExecutionTraceRepository traceRepository,
        ScopeContext scope,
        string primaryRunId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(traceRepository);

        Dictionary<string, AgentExecutionTraceLlmCostSlice> merged = new(StringComparer.Ordinal);

        foreach (string lookupKey in EnumerateRunIdRepositoryLookupKeys(primaryRunId))
        {
            IReadOnlyList<AgentExecutionTraceLlmCostSlice> slices = await traceRepository
                .GetLlmCostSlicesByRunIdAsync(scope, lookupKey, cancellationToken)
                .ConfigureAwait(false);

            if (slices is not { Count: > 0 })
                continue;

            foreach (AgentExecutionTraceLlmCostSlice slice in slices)
            {
                if (slice is null)
                    continue;

                merged.TryAdd(LlmCostSliceMergeKey(slice), slice);
            }
        }

        return merged.Count == 0 ? [] : merged.Values.ToList();
    }

    private static string LlmCostSliceMergeKey(AgentExecutionTraceLlmCostSlice slice) =>
        string.Create(
            CultureInfo.InvariantCulture,
            $"{slice.ModelDeploymentName}\u001e{slice.InputTokenCount}\u001e{slice.OutputTokenCount}\u001e{slice.ReasoningTokenCount}");

    internal static async Task<IReadOnlyList<AgentResult>> LoadAgentTypeMarkersByRunIdAsync(
        IAgentResultRepository resultRepository,
        ScopeContext scope,
        string primaryRunId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(resultRepository);

        Dictionary<string, AgentResult> merged = new(StringComparer.OrdinalIgnoreCase);

        foreach (string lookupKey in EnumerateRunIdRepositoryLookupKeys(primaryRunId))
        {
            IReadOnlyList<AgentResult> markers = await resultRepository
                .GetAgentTypeMarkersByRunIdAsync(scope, lookupKey, cancellationToken)
                .ConfigureAwait(false);

            if (markers is not { Count: > 0 })
                continue;

            foreach (AgentResult marker in markers)
            {
                if (marker is null)
                    continue;

                string mergeKey = string.IsNullOrWhiteSpace(marker.ResultId)
                    ? marker.AgentType.ToString()
                    : marker.ResultId;

                PreferNewerByCreatedUtc(merged, mergeKey, marker, static m => m.CreatedUtc);
            }
        }

        return merged.Count == 0 ? [] : merged.Values.ToList();
    }

    internal static async Task<AgentEvidencePackage?> LoadEvidencePackageByRunIdAsync(
        IAgentEvidencePackageRepository evidencePackageRepository,
        string primaryRunId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(evidencePackageRepository);

        Dictionary<string, AgentEvidencePackage> merged = new(StringComparer.OrdinalIgnoreCase);

        foreach (string lookupKey in EnumerateRunIdRepositoryLookupKeys(primaryRunId))
        {
            AgentEvidencePackage? evidence = await evidencePackageRepository
                .GetByRunIdAsync(lookupKey, cancellationToken)
                .ConfigureAwait(false);

            if (evidence is null || string.IsNullOrWhiteSpace(evidence.EvidencePackageId))
                continue;

            if (!merged.TryGetValue(evidence.EvidencePackageId, out AgentEvidencePackage? existing)
                || evidence.CreatedUtc > existing.CreatedUtc)
                merged[evidence.EvidencePackageId] = evidence;
        }

        if (merged.Count == 0)
            return null;

        return merged.Values
            .OrderByDescending(static package => package.CreatedUtc)
            .ThenBy(static package => package.EvidencePackageId, StringComparer.OrdinalIgnoreCase)
            .First();
    }

    internal static async Task<IReadOnlyList<DecisionNodeRecord>> LoadDecisionNodesByRunIdAsync(
        IDecisionNodeRepository decisionNodeRepository,
        string primaryRunId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(decisionNodeRepository);

        Dictionary<string, DecisionNodeRecord> merged = new(StringComparer.OrdinalIgnoreCase);

        foreach (string lookupKey in EnumerateRunIdRepositoryLookupKeys(primaryRunId))
        {
            IReadOnlyList<DecisionNodeRecord> nodes = await decisionNodeRepository
                .GetByRunIdAsync(lookupKey, cancellationToken)
                .ConfigureAwait(false);

            if (nodes is not { Count: > 0 })
                continue;

            foreach (DecisionNodeRecord node in nodes)
            {
                if (node is null)
                    continue;

                string mergeKey = string.IsNullOrWhiteSpace(node.DecisionId)
                    ? $"{node.Topic}:{node.RunId}"
                    : node.DecisionId;

                PreferNewerByCreatedUtc(merged, mergeKey, node, static n => n.CreatedUtc);
            }
        }

        return merged.Count == 0
            ? []
            : merged.Values
                .OrderByDescending(static node => node.CreatedUtc)
                .ThenBy(static node => node.DecisionId, StringComparer.OrdinalIgnoreCase)
                .ToList();
    }

    internal static async Task<IReadOnlyList<RunExportRecord>> LoadRunExportRecordsByRunIdAsync(
        IRunExportRecordRepository runExportRecordRepository,
        string primaryRunId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(runExportRecordRepository);

        Dictionary<string, RunExportRecord> merged = new(StringComparer.OrdinalIgnoreCase);

        foreach (string lookupKey in EnumerateRunIdRepositoryLookupKeys(primaryRunId))
        {
            IReadOnlyList<RunExportRecord> records = await runExportRecordRepository
                .GetByRunIdAsync(lookupKey, cancellationToken)
                .ConfigureAwait(false);

            if (records is not { Count: > 0 })
                continue;

            foreach (RunExportRecord record in records)
            {
                if (record is null || string.IsNullOrWhiteSpace(record.ExportRecordId))
                    continue;

                PreferNewerByCreatedUtc(merged, record.ExportRecordId, record, static r => r.CreatedUtc);
            }
        }

        return merged.Count == 0
            ? []
            : merged.Values
                .OrderByDescending(static record => record.CreatedUtc)
                .ThenBy(static record => record.ExportRecordId, StringComparer.OrdinalIgnoreCase)
                .ToList();
    }

    internal static async Task<IReadOnlyList<ComparisonRecord>> LoadComparisonRecordsByRunIdAsync(
        IComparisonRecordRepository comparisonRecordRepository,
        string primaryRunId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(comparisonRecordRepository);

        Dictionary<string, ComparisonRecord> merged = new(StringComparer.OrdinalIgnoreCase);

        foreach (string lookupKey in EnumerateRunIdRepositoryLookupKeys(primaryRunId))
        {
            IReadOnlyList<ComparisonRecord> records = await comparisonRecordRepository
                .GetByRunIdAsync(lookupKey, cancellationToken)
                .ConfigureAwait(false);

            if (records is not { Count: > 0 })
                continue;

            foreach (ComparisonRecord record in records)
            {
                if (record is null || string.IsNullOrWhiteSpace(record.ComparisonRecordId))
                    continue;

                PreferNewerByCreatedUtc(merged, record.ComparisonRecordId, record, static r => r.CreatedUtc);
            }
        }

        return merged.Count == 0
            ? []
            : merged.Values
                .OrderByDescending(static record => record.CreatedUtc)
                .ThenBy(static record => record.ComparisonRecordId, StringComparer.OrdinalIgnoreCase)
                .ToList();
    }

    internal static async Task<IReadOnlyList<GovernancePromotionRecord>> LoadGovernancePromotionRecordsByRunIdAsync(
        IGovernancePromotionRecordRepository promotionRecordRepository,
        string primaryRunId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(promotionRecordRepository);

        Dictionary<string, GovernancePromotionRecord> merged = new(StringComparer.OrdinalIgnoreCase);

        foreach (string lookupKey in EnumerateRunIdRepositoryLookupKeys(primaryRunId))
        {
            IReadOnlyList<GovernancePromotionRecord> records = await promotionRecordRepository
                .GetByRunIdAsync(lookupKey, cancellationToken)
                .ConfigureAwait(false);

            if (records is not { Count: > 0 })
                continue;

            foreach (GovernancePromotionRecord record in records)
            {
                if (record is null || string.IsNullOrWhiteSpace(record.PromotionRecordId))
                    continue;

                PreferNewerByCreatedUtc(merged, record.PromotionRecordId, record, static r => r.PromotedUtc);
            }
        }

        return merged.Count == 0
            ? []
            : merged.Values
                .OrderByDescending(static record => record.PromotedUtc)
                .ThenBy(static record => record.PromotionRecordId, StringComparer.OrdinalIgnoreCase)
                .ToList();
    }

    internal static async Task<IReadOnlyList<GovernanceApprovalRequest>> LoadGovernanceApprovalRequestsByRunIdAsync(
        IGovernanceApprovalRequestRepository approvalRequestRepository,
        string primaryRunId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(approvalRequestRepository);

        Dictionary<string, GovernanceApprovalRequest> merged = new(StringComparer.OrdinalIgnoreCase);

        foreach (string lookupKey in EnumerateRunIdRepositoryLookupKeys(primaryRunId))
        {
            IReadOnlyList<GovernanceApprovalRequest> records = await approvalRequestRepository
                .GetByRunIdAsync(lookupKey, cancellationToken)
                .ConfigureAwait(false);

            if (records is not { Count: > 0 })
                continue;

            foreach (GovernanceApprovalRequest record in records)
            {
                if (record is null || string.IsNullOrWhiteSpace(record.ApprovalRequestId))
                    continue;

                PreferNewerByCreatedUtc(merged, record.ApprovalRequestId, record, static r => r.RequestedUtc);
            }
        }

        return merged.Count == 0
            ? []
            : merged.Values
                .OrderByDescending(static record => record.RequestedUtc)
                .ThenBy(static record => record.ApprovalRequestId, StringComparer.OrdinalIgnoreCase)
                .ToList();
    }

    internal static async Task<IReadOnlyList<GovernanceEnvironmentActivation>> LoadGovernanceEnvironmentActivationsByRunIdAsync(
        IGovernanceEnvironmentActivationRepository environmentActivationRepository,
        string primaryRunId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(environmentActivationRepository);

        Dictionary<string, GovernanceEnvironmentActivation> merged = new(StringComparer.OrdinalIgnoreCase);

        foreach (string lookupKey in EnumerateRunIdRepositoryLookupKeys(primaryRunId))
        {
            IReadOnlyList<GovernanceEnvironmentActivation> records = await environmentActivationRepository
                .GetByRunIdAsync(lookupKey, cancellationToken)
                .ConfigureAwait(false);

            if (records is not { Count: > 0 })
                continue;

            foreach (GovernanceEnvironmentActivation record in records)
            {
                if (record is null || string.IsNullOrWhiteSpace(record.ActivationId))
                    continue;

                PreferNewerByCreatedUtc(merged, record.ActivationId, record, static r => r.ActivatedUtc);
            }
        }

        return merged.Count == 0
            ? []
            : merged.Values
                .OrderByDescending(static record => record.ActivatedUtc)
                .ThenBy(static record => record.ActivationId, StringComparer.OrdinalIgnoreCase)
                .ToList();
    }

    private static void PreferNewerByCreatedUtc<T>(
        Dictionary<string, T> merged,
        string mergeKey,
        T candidate,
        Func<T, DateTime> readCreatedUtc)
    {
        if (merged.TryGetValue(mergeKey, out T? existing)
            && readCreatedUtc(candidate) <= readCreatedUtc(existing))
            return;

        merged[mergeKey] = candidate;
    }
}
