using ArchLucid.Application.Governance;
using ArchLucid.Application.Roi;
using ArchLucid.Application.Value;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Pilots;
using ArchLucid.Contracts.ValueReports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Pilots;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Pilots;

/// <inheritdoc cref = "ISponsorEvidencePackService"/>
public sealed class SponsorEvidencePackService(
    IWhyArchLucidSnapshotService whyArchLucidSnapshotService,
    IRunDetailQueryService runDetailQueryService,
    IPilotRunDeltaComputer pilotRunDeltaComputer,
    IFindingsSnapshotRepository findingsSnapshotRepository,
    IGovernanceDashboardService governanceDashboardService,
    IScopeContextProvider scopeContextProvider,
    ValueReportBuilder valueReportBuilder,
    RoiCostEvidenceCollectionResolver roiCostEvidenceCollectionResolver,
    IPilotBaselineRepository pilotBaselineRepository,
    ILogger<SponsorEvidencePackService> logger) : ISponsorEvidencePackService
{
    private const int GovernanceListCap = 50;

    private readonly IFindingsSnapshotRepository _findingsSnapshotRepository =
        findingsSnapshotRepository ?? throw new ArgumentNullException(nameof(findingsSnapshotRepository));

    private readonly IGovernanceDashboardService _governanceDashboardService =
        governanceDashboardService ?? throw new ArgumentNullException(nameof(governanceDashboardService));

    private readonly ILogger<SponsorEvidencePackService> _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    private readonly IPilotRunDeltaComputer _pilotRunDeltaComputer = pilotRunDeltaComputer ?? throw new ArgumentNullException(nameof(pilotRunDeltaComputer));
    private readonly IRunDetailQueryService _runDetailQueryService = runDetailQueryService ?? throw new ArgumentNullException(nameof(runDetailQueryService));
    private readonly IScopeContextProvider _scopeContextProvider = scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IWhyArchLucidSnapshotService _whyArchLucidSnapshotService =
        whyArchLucidSnapshotService ?? throw new ArgumentNullException(nameof(whyArchLucidSnapshotService));

    private readonly ValueReportBuilder _valueReportBuilder =
        valueReportBuilder ?? throw new ArgumentNullException(nameof(valueReportBuilder));

    private readonly RoiCostEvidenceCollectionResolver _roiCostEvidenceCollectionResolver =
        roiCostEvidenceCollectionResolver ?? throw new ArgumentNullException(nameof(roiCostEvidenceCollectionResolver));

    private readonly IPilotBaselineRepository _pilotBaselineRepository =
        pilotBaselineRepository ?? throw new ArgumentNullException(nameof(pilotBaselineRepository));

    /// <inheritdoc/>
    public async Task<SponsorEvidencePackResponse> BuildAsync(CancellationToken cancellationToken)
    {
        WhyArchLucidSnapshotResponse process = await _whyArchLucidSnapshotService.BuildAsync(cancellationToken);
        string demoRunId = process.DemoRunId;
        ArchitectureRunDetail? detail = await _runDetailQueryService.GetRunDetailAsync(demoRunId, cancellationToken);
        PilotRunDeltasResponse? deltas = null;

        if (detail is not null)
        {
            PilotRunDeltas computed = await _pilotRunDeltaComputer.ComputeAsync(detail, cancellationToken);
            ScopeContext scope = _scopeContextProvider.GetCurrentScope();
            DateTimeOffset end = TimeProvider.System.GetUtcNow();
            DateTimeOffset start = end.AddDays(-30);
            ValueReportSnapshot valueWindowSnapshot = await _valueReportBuilder.BuildAsync(
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                start,
                end,
                cancellationToken);
            PilotBaselineRecord? scorecardBaselines =
                await _pilotBaselineRepository.GetAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);
            DateTime? extractorCollectionTimestampUtc =
                await _roiCostEvidenceCollectionResolver.TryResolveLatestCollectionTimestampUtcAsync(
                    scope,
                    detail.Run.RunId,
                    cancellationToken).ConfigureAwait(false);

            deltas = PilotRunDeltasResponseMapper.ToResponseWithProofPackage(
                detail.Run,
                detail.Manifest,
                computed,
                valueWindowSnapshot,
                extractorCollectionTimestampUtc,
                scorecardBaselines);
        }

        FindingsSnapshot resolved = await ResolveFindingsSnapshotAsync(detail, cancellationToken);
        TraceCompletenessSummary traceSummary = ExplainabilityTraceCompletenessAnalyzer.AnalyzeSnapshot(resolved);
        ExplainabilityTraceCompletenessPack explainability = SponsorEvidenceExplainabilityMapper.ToContract(traceSummary);
        SponsorEvidenceGovernanceOutcomes governance = await TryBuildGovernanceOutcomesAsync(cancellationToken);
        return new SponsorEvidencePackResponse
        {
            GeneratedUtc = process.GeneratedUtc,
            DemoRunId = demoRunId,
            ProcessInstrumentation = process,
            ExplainabilityTrace = explainability,
            DemoRunValueReportDelta = deltas,
            GovernanceOutcomes = governance
        };
    }

    private async Task<FindingsSnapshot> ResolveFindingsSnapshotAsync(ArchitectureRunDetail? detail, CancellationToken cancellationToken)
    {
        if (detail?.Run.FindingsSnapshotId is not { } snapshotId)
            return new FindingsSnapshot { Findings = [], TotalEstimatedSavings = 0m };
        try
        {
            ScopeContext scope = _scopeContextProvider.GetCurrentScope();
            FindingsSnapshot? loaded = await _findingsSnapshotRepository.GetByIdAsync(scope, snapshotId, cancellationToken);
            if (loaded is not null)
                return loaded;
            if (_logger.IsEnabled(LogLevel.Warning))
                _logger.LogWarning("Sponsor evidence pack: findings snapshot {SnapshotId} not found for demo run.", snapshotId);
            return new FindingsSnapshot { Findings = [], FindingsSnapshotId = snapshotId, TotalEstimatedSavings = 0m };
        }
        catch (Exception ex)when (ex is not OperationCanceledException)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
                _logger.LogWarning(ex, "Sponsor evidence pack: findings snapshot load failed.");
            return new FindingsSnapshot { Findings = [], TotalEstimatedSavings = 0m };
        }
    }

    private async Task<SponsorEvidenceGovernanceOutcomes> TryBuildGovernanceOutcomesAsync(CancellationToken cancellationToken)
    {
        Guid tenantId = _scopeContextProvider.GetCurrentScope().TenantId;
        try
        {
            GovernanceDashboardSummary dash =
                await _governanceDashboardService.GetDashboardAsync(tenantId, GovernanceListCap, GovernanceListCap, GovernanceListCap, cancellationToken);
            return new SponsorEvidenceGovernanceOutcomes
            {
                PendingApprovalCount = dash.PendingCount,
                RecentTerminalDecisionCount = dash.RecentDecisions.Count,
                RecentPolicyPackChangeCount = dash.RecentChanges.Count
            };
        }
        catch (Exception ex)when (ex is not OperationCanceledException)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
                _logger.LogWarning(ex, "Sponsor evidence pack: governance dashboard unavailable; returning zeros.");
            return new SponsorEvidenceGovernanceOutcomes { PendingApprovalCount = 0, RecentTerminalDecisionCount = 0, RecentPolicyPackChangeCount = 0 };
        }
    }
}
