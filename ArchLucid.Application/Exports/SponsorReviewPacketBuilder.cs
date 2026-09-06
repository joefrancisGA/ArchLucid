using ArchLucid.Application.Exports.ArchitectureReviewBoard;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Pilots;
using ArchLucid.Application.Roi;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Exports;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Roi;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Application.Exports;

/// <summary>One-click sponsor packet: manifest summary, findings, ROI basis labels, decisions, portfolio signals.</summary>
public sealed class SponsorReviewPacketBuilder(
    IRunDetailQueryService runDetailQueryService,
    ISponsorRoiSummaryService SponsorRoiSummaryService,
    IArchitectureDecisionRegisterService decisionRegisterService,
    IScopeContextProvider scopeContextProvider,
    ITenantRepository tenantRepository,
    IAuthorityQueryService authorityQueryService,
    IManifestHashService manifestHashService,
    IGraphSnapshotRepository graphSnapshotRepository,
    IConfiguration configuration) : ISponsorReviewPacketBuilder
{
    private readonly IRunDetailQueryService _runDetailQueryService =
        runDetailQueryService ?? throw new ArgumentNullException(nameof(runDetailQueryService));

    private readonly ISponsorRoiSummaryService _SponsorRoiSummaryService =
        SponsorRoiSummaryService ?? throw new ArgumentNullException(nameof(SponsorRoiSummaryService));

    private readonly IArchitectureDecisionRegisterService _decisionRegisterService =
        decisionRegisterService ?? throw new ArgumentNullException(nameof(decisionRegisterService));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));

    private readonly IManifestHashService _manifestHashService =
        manifestHashService ?? throw new ArgumentNullException(nameof(manifestHashService));

    private readonly IGraphSnapshotRepository _graphSnapshotRepository =
        graphSnapshotRepository ?? throw new ArgumentNullException(nameof(graphSnapshotRepository));

    private readonly IConfiguration _configuration =
        configuration ?? throw new ArgumentNullException(nameof(configuration));

    public async Task<string?> BuildMarkdownAsync(string runId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        ArchitectureRunDetail? detail = await _runDetailQueryService.GetRunDetailAsync(runId.Trim(), cancellationToken);

        if (detail is null)
            return null;

        if (!detail.IsCommitted || detail.HasBrokenManifestReference)
            return null;

        AuthorityLifecycleCompareExportGuard.EnsureCompleteOrThrow(detail, runId.Trim());

        if (Guid.TryParse(runId.Trim(), out Guid runGuid))
        {
            await ManifestDecisionReceiptExportBinder.EnsureSealedExportReceiptVerifiedOrThrowAsync(
                runGuid,
                runId.Trim(),
                _authorityQueryService,
                _manifestHashService,
                _scopeContextProvider.GetCurrentScope(),
                cancellationToken);
        }

        SponsorRoiSummaryResponse roiSummary =
            await _SponsorRoiSummaryService.BuildAsync(cancellationToken).ConfigureAwait(false);

        IReadOnlyList<ArchitectureFinding> topFindings =
            ArchitectureReviewBoardExportDocumentFactory.SelectRunSummaryTopFindings(detail, maxCount: 5);

        List<string> topTitles = topFindings
            .Select(static f => string.IsNullOrWhiteSpace(f.Message) ? f.Category : f.Message.Trim())
            .ToList();

        string SponsorReport = BuildDeterministicSponsorReport(detail, topFindings);
        IReadOnlyList<SponsorReviewPacketDecisionRow> topDecisions = await BuildTopDecisionsAsync(runId.Trim(), cancellationToken)
            .ConfigureAwait(false);
        SponsorReviewPacketPortfolioSignals portfolioSignals =
            SponsorReviewPacketPortfolioSignalsFactory.Create(roiSummary);

        string? activeTrialExportNotice = await ActiveTrialExportNoticeResolver
            .ResolveAsync(_scopeContextProvider, _tenantRepository, cancellationToken)
            .ConfigureAwait(false);
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        CareerExportCoverageHonestyInput careerExportHonesty = await CareerExportCoverageHonestyMaterialLoader.LoadAsync(
            detail,
            _authorityQueryService,
            _graphSnapshotRepository,
            scope,
            workingDesk: true,
            _configuration,
            cancellationToken);

        return SponsorReviewPacketComposer.ComposeMarkdown(
            detail,
            SponsorReport,
            topTitles,
            roiSummary,
            TimeProvider.System.UtcNowDateTime(),
            topDecisions,
            portfolioSignals,
            activeTrialExportNotice,
            careerExportHonesty);
    }

    private static string BuildDeterministicSponsorReport(
        ArchitectureRunDetail detail,
        IReadOnlyList<ArchitectureFinding> topFindings)
    {
        int critical = topFindings.Count(static f => f.Severity == FindingSeverity.Critical);
        int high = topFindings.Count(static f => f.Severity == FindingSeverity.Error);

        string systemName = detail.Manifest?.SystemName ?? detail.Run.RunId;

        return
            $"Architecture review for {systemName} is committed with {critical} critical and {high} high findings in the top set. "
            + "Use the ROI basis by disposition section to separate estimated potential from realized remediated value before sponsor sign-off.";
    }

    private async Task<IReadOnlyList<SponsorReviewPacketDecisionRow>> BuildTopDecisionsAsync(
        string runId,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(runId.Trim(), out Guid runGuid))
            return [];

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        ArchitectureDecisionRegisterResponse register = await _decisionRegisterService
            .GetRegisterAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, maxRows: 25, filters: null, cancellationToken)
            .ConfigureAwait(false);

        List<SponsorReviewPacketDecisionRow> rows = [];

        foreach (ArchitectureDecisionRegisterEntry entry in register.Decisions.Where(entry => entry.RunId == runGuid).Take(5))
        {
            rows.Add(new SponsorReviewPacketDecisionRow
            {
                Title = entry.Title,
                SelectedOption = entry.SelectedOption,
                ConfidenceLabel = entry.BuyerConfidenceSource ?? entry.ConfidenceSource,
                EvidenceHref = "/governance/decision-register",
            });
        }

        return rows;
    }

}
