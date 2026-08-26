using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph.Models;
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

    public async Task<IReadOnlyList<Finding>> AnalyzeAsync(GraphSnapshot graphSnapshot, CancellationToken ct)
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

        HashSet<string> remediationCandidateIds = trailEvents
            .Select(static e => e.FindingId)
            .Where(static id => !string.IsNullOrWhiteSpace(id))
            .Select(static id => id.Trim())
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        Dictionary<string, DateTimeOffset?> remediationDueByFindingId = await LoadRemediationDueDatesAsync(
            scope,
            remediationCandidateIds,
            ct);

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

        return orderedSignals.Select(signal => BuildFinding(signal)).ToList();
    }

    private async Task<Dictionary<string, DateTimeOffset?>> LoadRemediationDueDatesAsync(
        ScopeContext scope,
        IReadOnlySet<string> findingIds,
        CancellationToken ct)
    {
        Dictionary<string, DateTimeOffset?> remediationDueByFindingId =
            new(StringComparer.OrdinalIgnoreCase);

        foreach (string findingId in findingIds)
        {
            FindingInspectResponse? inspect = await _findingInspectReadRepository
                .GetInspectAsync(scope, findingId, ct, FindingInspectReadOptions.MetadataOnly);

            remediationDueByFindingId[findingId] = inspect?.RemediationDueUtc;
        }

        return remediationDueByFindingId;
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

    private static Finding BuildFinding(OpenCommitmentSignal signal)
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

        string title = BuildTitle(signal);
        string rationale = BuildRationale(signal);
        string decisionConsequence = BuildDecisionConsequence(signal);

        OpenCommitmentFindingPayload payload = new()
        {
            SignalKind = signal.Kind.ToString(),
            SourceFindingId = signal.SourceFindingId,
            DueOrExpiryUtc = signal.DueOrExpiryUtc,
            DaysOverdueOrUntilExpiry = signal.DaysOverdueOrUntilExpiry,
        };

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
            Payload = payload,
            Trace = new ExplainabilityTrace
            {
                RulesApplied = ["open-commitment", signal.ReasonToken],
            },
        };
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

    private static string BuildRationale(OpenCommitmentSignal signal)
    {
        return signal.Kind switch
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
    }

    private static string BuildDecisionConsequence(OpenCommitmentSignal signal)
    {
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
