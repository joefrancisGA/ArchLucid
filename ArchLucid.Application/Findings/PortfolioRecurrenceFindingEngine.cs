using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph.Models;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Findings;

/// <summary>
///     Reports when a finding identity in the current review recurs across other systems in the tenant portfolio.
/// </summary>
public sealed class PortfolioRecurrenceFindingEngine(
    IScopeContextProvider scopeContextProvider,
    IRunDetailQueryService runDetailQueryService,
    IFindingsSnapshotRepository findingsSnapshotRepository,
    IPortfolioRecurrenceFindingOptionsResolver optionsResolver,
    ILogger<PortfolioRecurrenceFindingEngine> logger) : IEffectfulFindingEngine
{
    private const int RunSummaryPageSize = 100;
    private const int RunSummaryMaxPages = 2_000;

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IRunDetailQueryService _runDetailQueryService =
        runDetailQueryService ?? throw new ArgumentNullException(nameof(runDetailQueryService));

    private readonly IFindingsSnapshotRepository _findingsSnapshotRepository =
        findingsSnapshotRepository ?? throw new ArgumentNullException(nameof(findingsSnapshotRepository));

    private readonly IPortfolioRecurrenceFindingOptionsResolver _optionsResolver =
        optionsResolver ?? throw new ArgumentNullException(nameof(optionsResolver));

    private readonly ILogger<PortfolioRecurrenceFindingEngine> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public string EngineType => "portfolio-recurrence";

    public string Category => "Topology";

    public async Task<IReadOnlyList<Finding>> AnalyzeAsync(GraphSnapshot graphSnapshot, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        PortfolioRecurrenceFindingOptions options = _optionsResolver.Resolve(ct);

        if (!options.Enabled)
        {
            return [];
        }

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        Dictionary<string, RunSummary> latestBySystem = await CollectLatestCommittedRunPerSystemAsync(ct)
            .ConfigureAwait(false);

        List<KeyValuePair<string, RunSummary>> scannedSystems = latestBySystem
            .OrderByDescending(static pair => pair.Value.CreatedUtc)
            .Take(options.MaxSystemsScanned)
            .ToList();

        int scannedSystemCount = scannedSystems.Count;

        if (scannedSystemCount == 0)
        {
            return [];
        }

        Dictionary<string, RecurrenceAccumulator> recurrenceByIdentity =
            new(StringComparer.Ordinal);

        Dictionary<string, HashSet<string>> identitiesBySystem =
            new(StringComparer.OrdinalIgnoreCase);

        foreach ((string systemName, RunSummary summary) in scannedSystems)
        {
            FindingsSnapshot? snapshot = await TryLoadFindingsSnapshotAsync(scope, summary.RunId, ct)
                .ConfigureAwait(false);

            if (snapshot is null)
            {
                continue;
            }

            HashSet<string> systemIdentities = new(StringComparer.Ordinal);
            identitiesBySystem[systemName] = systemIdentities;

            foreach (Finding finding in DeduplicateByMergeKey(snapshot.Findings))
            {
                if (!IsEligiblePortfolioFinding(finding))
                {
                    continue;
                }

                string identity = FindingSnapshotMergeKey.FromFinding(finding);
                systemIdentities.Add(identity);

                if (!recurrenceByIdentity.TryGetValue(identity, out RecurrenceAccumulator? accumulator))
                {
                    accumulator = new RecurrenceAccumulator(finding);
                    recurrenceByIdentity[identity] = accumulator;
                }

                accumulator.SystemNames.Add(systemName);
            }
        }

        HashSet<string> currentScopeIdentities = ResolveCurrentScopeIdentities(
            graphSnapshot,
            scannedSystems,
            identitiesBySystem);

        if (currentScopeIdentities.Count == 0)
        {
            return [];
        }

        List<RecurrenceAccumulator> qualifying = recurrenceByIdentity
            .Where(pair => currentScopeIdentities.Contains(pair.Key))
            .Select(static pair => pair.Value)
            .Where(accumulator => accumulator.SystemNames.Count >= options.MinSystemCountToReport)
            .OrderByDescending(static accumulator => accumulator.SystemNames.Count)
            .ThenBy(static accumulator => FindingSnapshotMergeKey.FromFinding(accumulator.RepresentativeFinding), StringComparer.Ordinal)
            .Take(options.MaxFindings)
            .ToList();

        return qualifying
            .Select(accumulator => BuildFinding(accumulator, scannedSystemCount, options))
            .ToList();
    }

    /// <summary>
    ///     Mirrors <see cref="SponsorRoiRunCollector.CollectLatestCommittedRunPerSystemAsync" /> without changing ROI behavior.
    /// </summary>
    private async Task<Dictionary<string, RunSummary>> CollectLatestCommittedRunPerSystemAsync(CancellationToken ct)
    {
        Dictionary<string, RunSummary> latestBySystem = new(StringComparer.OrdinalIgnoreCase);
        string? cursor = null;
        int pageCount = 0;

        while (true)
        {
            if (pageCount >= RunSummaryMaxPages)
            {
                _logger.LogWarning(
                    "CollectLatestCommittedRunPerSystemAsync: safety max-page cap ({Cap}) reached; stopping early.",
                    RunSummaryMaxPages);
                break;
            }

            (IReadOnlyList<RunSummary> items, bool hasMore, string? next) =
                await _runDetailQueryService.ListRunSummariesKeysetAsync(cursor, RunSummaryPageSize, ct)
                    .ConfigureAwait(false);

            pageCount++;

            foreach (RunSummary summary in items)
            {
                if (!SponsorRoiRunCollector.IsCommittedSummary(summary))
                {
                    continue;
                }

                string systemKey = SponsorRoiRunCollector.NormalizeSystemName(summary.SystemName);

                if (!latestBySystem.TryGetValue(systemKey, out RunSummary? existing)
                    || summary.CreatedUtc > existing.CreatedUtc)
                {
                    latestBySystem[systemKey] = summary;
                }
            }

            if (!hasMore || string.IsNullOrEmpty(next))
            {
                break;
            }

            cursor = next;
        }

        return latestBySystem;
    }

    private async Task<FindingsSnapshot?> TryLoadFindingsSnapshotAsync(
        ScopeContext scope,
        string runId,
        CancellationToken ct)
    {
        ArchitectureRunDetail? detail = await _runDetailQueryService
            .GetRunDetailForRoiAsync(runId, ct)
            .ConfigureAwait(false);

        if (detail?.Run.FindingsSnapshotId is not Guid snapshotId || snapshotId == Guid.Empty)
        {
            return null;
        }

        return await _findingsSnapshotRepository
            .GetByIdAsync(scope, snapshotId, ct)
            .ConfigureAwait(false);
    }

    private static HashSet<string> ResolveCurrentScopeIdentities(
        GraphSnapshot graphSnapshot,
        IReadOnlyList<KeyValuePair<string, RunSummary>> scannedSystems,
        IReadOnlyDictionary<string, HashSet<string>> identitiesBySystem)
    {
        string currentRunId = graphSnapshot.RunId.ToString("N");
        KeyValuePair<string, RunSummary>? currentSystem = scannedSystems
            .FirstOrDefault(pair => string.Equals(pair.Value.RunId, currentRunId, StringComparison.OrdinalIgnoreCase));

        if (currentSystem is null)
        {
            return [];
        }

        if (!identitiesBySystem.TryGetValue(currentSystem.Value.Key, out HashSet<string>? identities))
        {
            return [];
        }

        return identities;
    }

    private static IEnumerable<Finding> DeduplicateByMergeKey(IEnumerable<Finding> findings)
    {
        Dictionary<string, Finding> bestByIdentity = new(StringComparer.Ordinal);
        List<string> identityOrder = [];

        foreach (Finding finding in findings)
        {
            string identity = FindingSnapshotMergeKey.FromFinding(finding);

            if (!bestByIdentity.ContainsKey(identity))
            {
                bestByIdentity[identity] = finding;
                identityOrder.Add(identity);
            }
        }

        foreach (string identity in identityOrder)
        {
            yield return bestByIdentity[identity];
        }
    }

    private static bool IsEligiblePortfolioFinding(Finding finding)
    {
        if (finding.IsMuted)
        {
            return false;
        }

        if (finding.Classification == FindingClassification.ChecklistCoverage)
        {
            return false;
        }

        return true;
    }

    private Finding BuildFinding(
        RecurrenceAccumulator accumulator,
        int scannedSystemCount,
        PortfolioRecurrenceFindingOptions options)
    {
        Finding representative = accumulator.RepresentativeFinding;
        int systemCount = accumulator.SystemNames.Count;
        string identity = FindingSnapshotMergeKey.FromFinding(representative);
        List<string> orderedSystems = accumulator.SystemNames
            .OrderBy(static name => name, StringComparer.OrdinalIgnoreCase)
            .ToList();

        FindingSeverity severity = systemCount >= options.MinSystemCountToReport * 2
            ? FindingSeverity.Error
            : FindingSeverity.Warning;

        PortfolioRecurrenceFindingPayload payload = new()
        {
            IdentityToken = identity,
            SystemCount = systemCount,
            ScannedSystemCount = scannedSystemCount,
        };

        return new Finding
        {
            FindingSchemaVersion = FindingsSchema.CurrentFindingVersion,
            FindingType = "PortfolioRecurrenceFinding",
            Category = Category,
            EngineType = EngineType,
            Severity = severity,
            Title = $"Recurs across {systemCount} reviewed systems",
            Rationale = BuildRationale(representative, orderedSystems, systemCount),
            DecisionConsequence = BuildDecisionConsequence(representative, systemCount),
            Payload = payload,
            PayloadType = nameof(PortfolioRecurrenceFindingPayload),
            PolicyRuleId = representative.PolicyRuleId,
            Trace = new ExplainabilityTrace
            {
                RulesApplied = ["portfolio-recurrence", identity],
            },
        };
    }

    private static string BuildRationale(Finding representative, IReadOnlyList<string> systemNames, int systemCount)
    {
        string systemsList = string.Join(", ", systemNames);
        string subject = string.IsNullOrWhiteSpace(representative.PolicyRuleId)
            ? $"'{representative.Title}' ({representative.Category})"
            : $"policy rule {representative.PolicyRuleId} ({representative.Category})";

        return $"The same finding ({subject}) is open in {systemCount} reviewed systems: {systemsList}.";
    }

    private static string BuildDecisionConsequence(Finding representative, int systemCount)
    {
        string subject = string.IsNullOrWhiteSpace(representative.PolicyRuleId)
            ? representative.Title
            : representative.PolicyRuleId;

        return $"This issue recurs in {systemCount} systems ({subject}). Prefer a platform guardrail or policy-pack rule over a one-off per-system fix.";
    }

    private sealed class RecurrenceAccumulator(Finding representativeFinding)
    {
        public Finding RepresentativeFinding { get; } = representativeFinding;

        public HashSet<string> SystemNames { get; } = new(StringComparer.OrdinalIgnoreCase);
    }
}
