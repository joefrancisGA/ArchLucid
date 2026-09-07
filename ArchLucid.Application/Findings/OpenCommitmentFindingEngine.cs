using ArchLucid.Contracts.Architecture;
using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Findings;

/// <summary>Surfaces overdue deferrals, unanswered evidence requests, expiring waivers, and overdue remediations.</summary>
public sealed class OpenCommitmentFindingEngine(
    IScopeContextProvider scopeContextProvider,
    IFindingReviewTrailRepository findingReviewTrailRepository,
    IRiskExceptionService riskExceptionService,
    IFindingInspectReadRepository findingInspectReadRepository,
    TimeProvider clock,
    IOptions<OpenCommitmentFindingOptions> options) : IEffectfulFindingEngine
{
    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IFindingReviewTrailRepository _findingReviewTrailRepository =
        findingReviewTrailRepository ?? throw new ArgumentNullException(nameof(findingReviewTrailRepository));

    private readonly IRiskExceptionService _riskExceptionService =
        riskExceptionService ?? throw new ArgumentNullException(nameof(riskExceptionService));

    private readonly IFindingInspectReadRepository _findingInspectReadRepository =
        findingInspectReadRepository ?? throw new ArgumentNullException(nameof(findingInspectReadRepository));

    private readonly TimeProvider _clock = clock ?? throw new ArgumentNullException(nameof(clock));

    private readonly OpenCommitmentFindingOptions _options =
        options?.Value ?? throw new ArgumentNullException(nameof(options));

    public string EngineType => "open-commitment";

    public string Category => "Governance";

    public async Task<IReadOnlyList<Finding>> AnalyzeAsync(GraphSnapshot graphSnapshot, FindingAnalysisContext? analysisContext,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        if (!_options.Enabled)
        {
            return [];
        }

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        DateTimeOffset now = _clock.GetUtcNow();
        DateTimeOffset sinceUtc = now - _options.Lookback;

        IReadOnlyList<FindingReviewEventRecord> trailEvents = await _findingReviewTrailRepository
            .ListSinceUtcAsync(scope.TenantId, sinceUtc, ct);

        IReadOnlyList<RiskExceptionRecord> activeWaivers = await _riskExceptionService
            .ListActiveAsync(scope.TenantId, scope.ProjectId, ct);

        Dictionary<string, FindingReviewEventRecord> latestEventByFindingId =
            BuildLatestEventByFindingId(trailEvents);

        HashSet<string> sourceFindingIds = CollectSourceFindingIds(trailEvents, activeWaivers);

        Dictionary<string, FindingInspectResponse?> inspectByFindingId = await LoadSourceFindingInspectAsync(
            scope,
            sourceFindingIds,
            ct);

        Dictionary<string, DateTimeOffset?> remediationDueByFindingId = inspectByFindingId
            .ToDictionary(static pair => pair.Key, static pair => pair.Value?.RemediationDueUtc, StringComparer.OrdinalIgnoreCase);

        IReadOnlyList<OpenCommitmentSignal> signals = OpenCommitmentClassifier.Classify(
            trailEvents,
            activeWaivers,
            remediationDueByFindingId,
            now,
            _options.WaiverExpiryWarningDays);

        List<OpenCommitmentSignal> orderedSignals = signals
            .OrderBy(static signal => GetKindPriority(signal.Kind))
            .ThenByDescending(static signal => signal.DaysOverdueOrUntilExpiry)
            .ThenBy(static signal => signal.SourceFindingId, StringComparer.Ordinal)
            .Take(_options.MaxFindings)
            .ToList();

        List<Finding> findings = [];

        foreach (OpenCommitmentSignal signal in orderedSignals)
        {
            inspectByFindingId.TryGetValue(signal.SourceFindingId, out FindingInspectResponse? inspect);
            latestEventByFindingId.TryGetValue(signal.SourceFindingId, out FindingReviewEventRecord? trailEvent);

            findings.Add(BuildFinding(signal, graphSnapshot, inspect, trailEvent));
        }

        return findings;
    }

    private async Task<Dictionary<string, FindingInspectResponse?>> LoadSourceFindingInspectAsync(
        ScopeContext scope,
        IReadOnlySet<string> findingIds,
        CancellationToken ct)
    {
        Dictionary<string, FindingInspectResponse?> inspectByFindingId =
            new(StringComparer.OrdinalIgnoreCase);

        foreach (string findingId in findingIds)
        {
            inspectByFindingId[findingId] = await _findingInspectReadRepository
                .GetInspectAsync(scope, findingId, ct, FindingInspectReadOptions.MetadataOnly);
        }

        return inspectByFindingId;
    }

    private static HashSet<string> CollectSourceFindingIds(
        IReadOnlyList<FindingReviewEventRecord> trailEvents,
        IReadOnlyList<RiskExceptionRecord> activeWaivers)
    {
        HashSet<string> findingIds = new(StringComparer.OrdinalIgnoreCase);

        foreach (FindingReviewEventRecord eventRecord in trailEvents)
        {
            if (string.IsNullOrWhiteSpace(eventRecord.FindingId))
            {
                continue;
            }

            findingIds.Add(eventRecord.FindingId.Trim());
        }

        foreach (RiskExceptionRecord waiver in activeWaivers)
        {
            if (string.IsNullOrWhiteSpace(waiver.FindingId))
            {
                continue;
            }

            findingIds.Add(waiver.FindingId.Trim());
        }

        return findingIds;
    }

    private static Dictionary<string, FindingReviewEventRecord> BuildLatestEventByFindingId(
        IReadOnlyList<FindingReviewEventRecord> events)
    {
        Dictionary<string, FindingReviewEventRecord> latestEventByFindingId =
            new(StringComparer.OrdinalIgnoreCase);

        foreach (FindingReviewEventRecord eventRecord in events.OrderBy(static e => e.OccurredAtUtc))
        {
            if (string.IsNullOrWhiteSpace(eventRecord.FindingId))
            {
                continue;
            }

            latestEventByFindingId[eventRecord.FindingId.Trim()] = eventRecord;
        }

        return latestEventByFindingId;
    }

    private static int GetKindPriority(OpenCommitmentSignalKind kind)
    {
        return kind switch
        {
            OpenCommitmentSignalKind.ExpiredWaiver => 0,
            OpenCommitmentSignalKind.OverdueRemediation => 1,
            OpenCommitmentSignalKind.OverdueDeferral => 2,
            OpenCommitmentSignalKind.UnansweredEvidenceRequest => 3,
            OpenCommitmentSignalKind.ExpiringWaiver => 4,
            _ => 5,
        };
    }

    private static Finding BuildFinding(
        OpenCommitmentSignal signal,
        GraphSnapshot graphSnapshot,
        FindingInspectResponse? inspect,
        FindingReviewEventRecord? trailEvent)
    {
        OpenCommitmentTopologyJoiner.JoinResult joinResult =
            OpenCommitmentTopologyJoiner.TryJoin(graphSnapshot, inspect, trailEvent);

        IReadOnlyList<string> textSegments =
            OpenCommitmentCommitmentTextCollector.CollectTextSegments(inspect, trailEvent);

        OpenCommitmentDeclarationTheme theme = joinResult.TopologyMatch
            ? OpenCommitmentDeclarationThemeDetector.Detect(textSegments)
            : OpenCommitmentDeclarationTheme.None;

        bool stillOpenOnCurrentGraph = joinResult.TopologyMatch
            && joinResult.MatchedNode is not null
            && theme != OpenCommitmentDeclarationTheme.None
            && OpenCommitmentStillOpenEvaluator.IsStillOpen(theme, joinResult.MatchedNode.Properties);

        FindingSeverity severity = ResolveSeverity(signal, stillOpenOnCurrentGraph);

        string title = BuildTitle(signal);
        string rationale = BuildRationale(signal, joinResult, stillOpenOnCurrentGraph);
        string decisionConsequence = BuildDecisionConsequence(signal, stillOpenOnCurrentGraph);

        OpenCommitmentFindingPayload payload = new()
        {
            SignalKind = signal.Kind.ToString(),
            SourceFindingId = signal.SourceFindingId,
            DueOrExpiryUtc = signal.DueOrExpiryUtc,
            DaysOverdueOrUntilExpiry = signal.DaysOverdueOrUntilExpiry,
            TopologyMatch = joinResult.TopologyMatch,
            StillOpenOnCurrentGraph = stillOpenOnCurrentGraph,
            MatchedTopologyNodeId = joinResult.MatchedNode?.NodeId,
        };

        List<string> traceNotes =
        [
            $"evidence:commitment:{signal.SourceFindingId}",
        ];

        if (joinResult.MatchedNode is GraphNode matchedNode
            && !string.IsNullOrWhiteSpace(matchedNode.NodeId))
        {
            traceNotes.Add($"evidence:graph-node:{matchedNode.NodeId.Trim()}");
        }

        List<string> relatedNodeIds = [];

        if (joinResult.MatchedNode is GraphNode relatedNode
            && !string.IsNullOrWhiteSpace(relatedNode.NodeId))
        {
            relatedNodeIds.Add(relatedNode.NodeId.Trim());
        }

        return new Finding
        {
            FindingSchemaVersion = FindingsSchema.CurrentFindingVersion,
            FindingType = "OpenCommitmentFinding",
            Category = "Governance",
            EngineType = "open-commitment",
            Severity = severity,
            Title = title,
            Rationale = rationale,
            DecisionConsequence = decisionConsequence,
            RelatedNodeIds = relatedNodeIds,
            Payload = payload,
            Trace = new ExplainabilityTrace
            {
                RulesApplied = ["open-commitment", signal.ReasonToken],
                Notes = traceNotes,
            },
        };
    }

    private static FindingSeverity ResolveSeverity(OpenCommitmentSignal signal, bool stillOpenOnCurrentGraph)
    {
        FindingSeverity severity = signal.Kind switch
        {
            OpenCommitmentSignalKind.ExpiredWaiver => FindingSeverity.Error,
            OpenCommitmentSignalKind.OverdueRemediation => FindingSeverity.Error,
            OpenCommitmentSignalKind.OverdueDeferral => FindingSeverity.Warning,
            OpenCommitmentSignalKind.UnansweredEvidenceRequest => FindingSeverity.Warning,
            OpenCommitmentSignalKind.ExpiringWaiver => FindingSeverity.Info,
            _ => FindingSeverity.Warning,
        };

        if (stillOpenOnCurrentGraph && severity < FindingSeverity.Warning)
        {
            severity = FindingSeverity.Warning;
        }

        return severity;
    }

    private static string BuildTitle(OpenCommitmentSignal signal)
    {
        return signal.Kind switch
        {
            OpenCommitmentSignalKind.ExpiredWaiver =>
                $"Risk waiver for finding {signal.SourceFindingId} expired on {signal.DueOrExpiryUtc:yyyy-MM-dd}",
            OpenCommitmentSignalKind.ExpiringWaiver =>
                $"Risk waiver for finding {signal.SourceFindingId} expires on {signal.DueOrExpiryUtc:yyyy-MM-dd}",
            OpenCommitmentSignalKind.OverdueDeferral =>
                $"Deferred finding {signal.SourceFindingId} revisit was due {signal.DueOrExpiryUtc:yyyy-MM-dd}",
            OpenCommitmentSignalKind.UnansweredEvidenceRequest =>
                $"Evidence request for finding {signal.SourceFindingId} remains unanswered",
            OpenCommitmentSignalKind.OverdueRemediation =>
                $"Remediation for finding {signal.SourceFindingId} was due {signal.DueOrExpiryUtc:yyyy-MM-dd}",
            _ => $"Open commitment on finding {signal.SourceFindingId}",
        };
    }

    private static string BuildRationale(
        OpenCommitmentSignal signal,
        OpenCommitmentTopologyJoiner.JoinResult joinResult,
        bool stillOpenOnCurrentGraph)
    {
        string baseRationale = signal.Kind switch
        {
            OpenCommitmentSignalKind.ExpiredWaiver =>
                $"An active risk waiver protecting finding {signal.SourceFindingId} expired {signal.DaysOverdueOrUntilExpiry} day(s) ago on {signal.DueOrExpiryUtc:u}.",
            OpenCommitmentSignalKind.ExpiringWaiver =>
                $"Risk waiver protecting finding {signal.SourceFindingId} expires in {signal.DaysOverdueOrUntilExpiry} day(s) on {signal.DueOrExpiryUtc:u}.",
            OpenCommitmentSignalKind.OverdueDeferral =>
                $"Finding {signal.SourceFindingId} was deferred with revisit due {signal.DueOrExpiryUtc:u}, which is now {signal.DaysOverdueOrUntilExpiry} day(s) overdue.",
            OpenCommitmentSignalKind.UnansweredEvidenceRequest =>
                $"Finding {signal.SourceFindingId} still needs evidence with no later disposition recorded since {signal.DueOrExpiryUtc:u}.",
            OpenCommitmentSignalKind.OverdueRemediation =>
                $"Remediation for finding {signal.SourceFindingId} was assigned with due date {signal.DueOrExpiryUtc:u}, now {signal.DaysOverdueOrUntilExpiry} day(s) overdue.",
            _ => $"Open governance commitment recorded for finding {signal.SourceFindingId}.",
        };

        if (stillOpenOnCurrentGraph && joinResult.MatchedNode is GraphNode matchedNode)
        {
            return baseRationale
                + $" The deferred control is still absent on topology node '{matchedNode.Label}' on this review graph.";
        }

        if (joinResult.TopologyMatch && joinResult.MatchedNode is GraphNode joinedNode)
        {
            return baseRationale
                + $" Matched topology node '{joinedNode.Label}' on this review graph.";
        }

        return baseRationale;
    }

    private static string BuildDecisionConsequence(OpenCommitmentSignal signal, bool stillOpenOnCurrentGraph)
    {
        if (stillOpenOnCurrentGraph)
        {
            return "Remediate the matched topology control or record a new disposition before approving this review.";
        }

        return signal.Kind switch
        {
            OpenCommitmentSignalKind.ExpiredWaiver =>
                "Do not approve the review until the waiver is renewed or the underlying finding is remediated.",
            OpenCommitmentSignalKind.ExpiringWaiver =>
                "Renew the waiver or remediate the finding before expiry to avoid an approval blocker.",
            OpenCommitmentSignalKind.OverdueDeferral =>
                "Resolve the deferred finding or record a new disposition before approving this review.",
            OpenCommitmentSignalKind.UnansweredEvidenceRequest =>
                "Provide the requested evidence or change disposition before treating the review as complete.",
            OpenCommitmentSignalKind.OverdueRemediation =>
                "Complete remediation or formally accept risk before approving downstream changes.",
            _ => "Close the open governance commitment before approving this review.",
        };
    }
}
