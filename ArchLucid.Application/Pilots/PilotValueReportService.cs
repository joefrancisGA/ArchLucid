using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Audit;
using ArchLucid.Persistence.Data.Repositories;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Pilots;

public interface IPilotValueReportService
{
    /// <summary>
    ///     Builds a pilot value report for the current scope. Returns null when the tenant record is missing.
    ///     When <paramref name = "fromUtc"/> is null, uses the tenant&apos;s <see cref = "TenantRecord.CreatedUtc"/> (UTC).
    ///     When <paramref name = "toUtc"/> is null, uses the current UTC instant from <see cref = "TimeProvider.System"/> as the exclusive upper bound
    ///     (aligned with <see cref = "IAuditRepository.GetExportAsync"/>).
    /// </summary>
    Task<PilotValueReport?> BuildAsync(DateTime? fromUtc, DateTime? toUtc, CancellationToken cancellationToken);
}

/// <summary>
///     Read-only aggregate: run summaries + run details + scoped audit export + scoped pending-approvals count.
///     Durable audit reads use <see cref = "IAuditRepository"/> (existing product pattern; <see cref = "IAuditService"/> is
///     append-only).
/// </summary>
public sealed class PilotValueReportService(
    IRunDetailQueryService runDetailQuery,
    IAuditRepository auditRepository,
    ITenantRepository tenantRepository,
    IScopeContextProvider scopeContextProvider,
    IGovernanceApprovalRequestRepository approvalRequestRepository,
    ILogger<PilotValueReportService> logger) : IPilotValueReportService
{
    /// <summary>
    ///     Max committed runs fully loaded for finding/agent/timing aggregation per report (defense against huge
    ///     tenants).
    /// </summary>
    public const int DefaultRunDetailCap = 400;

    /// <summary>Audit export row cap (matches <see cref = "DapperAuditRepository.GetExportAsync"/> clamp).</summary>
    public const int AuditExportMaxRows = 10_000;

    /// <summary>
    ///     Default pilot-to-date window when <c>fromUtc</c> is omitted (parity with
    ///     <see cref="ArchLucid.Api.Controllers.Tenancy.TenantLlmCostReportingController"/> and
    ///     <see cref="ArchLucid.Api.Controllers.Tenancy.TenantPilotValueReportController.MaxRollingDays"/>).
    /// </summary>
    public const int DefaultReportWindowMaxDays = 90;

    private const int RunSummaryPageSize = 100;

    /// <summary>Safety cap: 100 rows/page × 2 000 pages = 200 000 run summaries scanned per report.</summary>
    private const int RunSummaryMaxPages = 2_000;

    private static readonly HashSet<string> ApprovalEventTypes =
        [AuditEventTypes.GovernanceApprovalApproved, AuditEventTypes.Baseline.Governance.ApprovalRequestApproved];

    private static readonly HashSet<string> RejectionEventTypes =
        [AuditEventTypes.GovernanceApprovalRejected, AuditEventTypes.Baseline.Governance.ApprovalRequestRejected];

    private static readonly HashSet<string> PolicyPackAssignmentEventTypes = [AuditEventTypes.PolicyPackAssigned, AuditEventTypes.PolicyPackAssignmentCreated];

    private static readonly HashSet<string> ComparisonDriftEventTypes =
    [
        AuditEventTypes.ComparisonSummaryPersisted, AuditEventTypes.AlertRuleCandidateComparisonExecuted, AuditEventTypes.GovernanceConflictDetected,
        AuditEventTypes.GovernancePreCommitSimulationEvaluated, AuditEventTypes.ReplayExecuted, AuditEventTypes.InternalArchitectureDeterminismCheckExecuted
    ];

    private readonly IAuditRepository _auditRepository = auditRepository ?? throw new ArgumentNullException(nameof(auditRepository));

    private readonly IGovernanceApprovalRequestRepository _approvalRequestRepository =
        approvalRequestRepository ?? throw new ArgumentNullException(nameof(approvalRequestRepository));

    private readonly ILogger<PilotValueReportService> _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    private readonly IRunDetailQueryService _runDetailQuery = runDetailQuery ?? throw new ArgumentNullException(nameof(runDetailQuery));
    private readonly IScopeContextProvider _scopeContextProvider = scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));
    private readonly ITenantRepository _tenantRepository = tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    /// <inheritdoc/>
    public async Task<PilotValueReport?> BuildAsync(DateTime? fromUtc, DateTime? toUtc, CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(scope.TenantId, cancellationToken);

        if (tenant is null)
            return null;

        long pendingApprovalsNow =
            await _approvalRequestRepository.CountPendingApprovalsAsync(cancellationToken).ConfigureAwait(false);

        DateTime toExclusive = toUtc ?? TimeProvider.System.UtcNowDateTime();
        DateTime from = fromUtc ?? tenant.CreatedUtc.UtcDateTime;

        if (fromUtc is null)
        {
            DateTime earliestDefault = toExclusive.AddDays(-DefaultReportWindowMaxDays);

            if (from < earliestDefault)
                from = earliestDefault;
        }

        if (toExclusive <= from)
            return EmptyReport(scope.TenantId, from, toExclusive, pendingApprovalsNow);
        List<CommittedRunRef> committedRuns = await CollectCommittedRunsAsync(from, toExclusive, cancellationToken).ConfigureAwait(false);
        committedRuns.Sort(static (a, b) => a.CreatedUtc.CompareTo(b.CreatedUtc));
        IReadOnlyList<AuditEvent> auditRows = await _auditRepository
            .GetExportAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, from, toExclusive, AuditExportMaxRows, cancellationToken).ConfigureAwait(false);
        bool auditTruncated = auditRows.Count >= AuditExportMaxRows;

        if (auditTruncated && _logger.IsEnabled(LogLevel.Warning))
            _logger.LogWarning("Pilot value report: audit export capped at {Cap} for tenant {TenantId}.", AuditExportMaxRows, scope.TenantId);
        int approvals = auditRows.Count(e => ApprovalEventTypes.Contains(e.EventType));
        int rejections = auditRows.Count(e => RejectionEventTypes.Contains(e.EventType));
        int policyAssignments = auditRows.Count(e => PolicyPackAssignmentEventTypes.Contains(e.EventType));
        int compareDrift = auditRows.Count(e => ComparisonDriftEventTypes.Contains(e.EventType));
        int recommendations = auditRows.Count(e => string.Equals(e.EventType, AuditEventTypes.RecommendationGenerated, StringComparison.Ordinal));
        bool runDetailsTruncated = committedRuns.Count > DefaultRunDetailCap;
        List<CommittedRunRef> runsForDetails = committedRuns;

        if (runDetailsTruncated)
        {
            runsForDetails = committedRuns.Take(DefaultRunDetailCap).ToList();

            if (_logger.IsEnabled(LogLevel.Warning))
            {
                _logger.LogWarning("Pilot value report: loading run details for {Loaded} of {Total} committed runs (cap {Cap}).", runsForDetails.Count,
                    committedRuns.Count, DefaultRunDetailCap);
            }
        }

        PilotValueReportSeverityBreakdown severities = new();
        List<double> completionSeconds = [];
        HashSet<string> agentTypes = new(StringComparer.OrdinalIgnoreCase);
        List<PilotValueReportRunTimelinePoint> timeline = [];

        foreach (CommittedRunRef runRef in runsForDetails)
        {
            ArchitectureRunDetail? detail =
                await _runDetailQuery.GetRunDetailForRoiAsync(runRef.RunId, cancellationToken).ConfigureAwait(false);

            if (detail is null)
                continue;

            AddFindings(detail, severities);

            foreach (AgentResult r in detail.Results)
                agentTypes.Add(r.AgentType.ToString());

            DateTime? committedUtc = detail.Manifest?.Metadata.CreatedUtc;

            if (committedUtc is { } c)
            {
                TimeSpan wall = c - detail.Run.CreatedUtc;

                if (wall >= TimeSpan.Zero)
                    completionSeconds.Add(wall.TotalSeconds);
            }

            timeline.Add(new PilotValueReportRunTimelinePoint
            {
                RunId = runRef.RunId,
                CreatedUtc = detail.Run.CreatedUtc,
                CommittedUtc = committedUtc,
                SystemName = detail.Manifest?.SystemName ?? string.Empty
            });
        }

        timeline.Sort(static (a, b) => a.CreatedUtc.CompareTo(b.CreatedUtc));
        int totalFindings = severities.Critical + severities.High + severities.Medium + severities.Low + severities.Info;
        double? avgSeconds = completionSeconds.Count > 0 ? completionSeconds.Average() : null;
        return new PilotValueReport
        {
            TenantId = scope.TenantId,
            FromUtc = from,
            ToUtc = toExclusive,
            TotalRunsCommitted = committedRuns.Count,
            RunDetailsTruncated = runDetailsTruncated,
            RunDetailCap = DefaultRunDetailCap,
            TotalFindings = totalFindings,
            FindingsBySeverity = severities,
            TotalRecommendationsProduced = recommendations,
            AveragePipelineCompletionSeconds = avgSeconds,
            GovernanceApprovals = approvals,
            GovernanceRejections = rejections,
            PolicyPackAssignments = policyAssignments,
            ComparisonOrDriftDetections = compareDrift,
            UniqueAgentTypes = agentTypes.OrderBy(static s => s, StringComparer.OrdinalIgnoreCase).ToList(),
            CommittedRunsTimeline = timeline,
            GovernancePendingApprovalsNow = pendingApprovalsNow,
            AuditExportTruncated = auditTruncated
        };
    }

    private async Task<List<CommittedRunRef>> CollectCommittedRunsAsync(DateTime fromInclusive, DateTime toExclusive, CancellationToken cancellationToken)
    {
        List<CommittedRunRef> rows = [];
        string? cursor = null;
        int pageCount = 0;

        while (true)
        {
            if (pageCount >= RunSummaryMaxPages)
            {
                if (_logger.IsEnabled(LogLevel.Warning))
                {
                    _logger.LogWarning(
                        "Pilot value report: run-summary keyset max-page cap ({Cap}) reached.",
                        RunSummaryMaxPages);
                }

                break;
            }

            (IReadOnlyList<RunSummary> items, bool hasMore, string? next) =
                await _runDetailQuery.ListRunSummariesKeysetAsync(cursor, RunSummaryPageSize, cancellationToken).ConfigureAwait(false);

            pageCount++;

            bool stopPaging = false;

            foreach (RunSummary s in items)
            {
                if (s.CreatedUtc < fromInclusive)
                {
                    stopPaging = true;
                    break;
                }

                if (s.CreatedUtc < toExclusive && IsCommittedSummary(s))
                    rows.Add(new CommittedRunRef(s.RunId, s.CreatedUtc));
            }

            if (stopPaging || !hasMore || string.IsNullOrEmpty(next))
                break;

            cursor = next;
        }

        return rows;
    }

    private static bool IsCommittedSummary(RunSummary summary)
    {
        return string.Equals(summary.Status, nameof(ArchitectureRunStatus.Committed), StringComparison.OrdinalIgnoreCase);
    }

    private static void AddFindings(ArchitectureRunDetail detail, PilotValueReportSeverityBreakdown target)
    {
        foreach (ArchitectureFinding f in detail.Results.SelectMany(static r => r.Findings).Where(static f => !f.IsMuted))
        {
            switch (f.Severity)
            {
                case FindingSeverity.Critical:
                    target.Critical++;
                    break;
                case FindingSeverity.Error:
                    target.High++;
                    break;
                case FindingSeverity.Warning:
                    target.Medium++;
                    break;
                case FindingSeverity.Info:
                default:
                    target.Info++;
                    break;
            }
        }
    }

    private static PilotValueReport EmptyReport(Guid tenantId, DateTime from, DateTime toExclusive, long pendingApprovals)
    {
        return new PilotValueReport
        {
            TenantId = tenantId,
            FromUtc = from,
            ToUtc = toExclusive,
            TotalRunsCommitted = 0,
            RunDetailsTruncated = false,
            RunDetailCap = DefaultRunDetailCap,
            TotalFindings = 0,
            FindingsBySeverity = new PilotValueReportSeverityBreakdown(),
            TotalRecommendationsProduced = 0,
            AveragePipelineCompletionSeconds = null,
            GovernanceApprovals = 0,
            GovernanceRejections = 0,
            PolicyPackAssignments = 0,
            ComparisonOrDriftDetections = 0,
            UniqueAgentTypes = [],
            CommittedRunsTimeline = [],
            GovernancePendingApprovalsNow = pendingApprovals,
            AuditExportTruncated = false
        };
    }

    private readonly record struct CommittedRunRef(string RunId, DateTime CreatedUtc);
}
