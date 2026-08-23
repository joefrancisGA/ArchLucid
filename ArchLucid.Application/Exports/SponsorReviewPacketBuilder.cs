using ArchLucid.Application.Exports.ArchitectureReviewBoard;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Exports;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Roi;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Exports;

/// <summary>One-click sponsor packet: manifest summary, findings, ROI basis labels, decisions, portfolio signals.</summary>
public sealed class SponsorReviewPacketBuilder(
    IRunDetailQueryService runDetailQueryService,
    ISponsorRoiSummaryService SponsorRoiSummaryService,
    IArchitectureDecisionRegisterService decisionRegisterService,
    IScopeContextProvider scopeContextProvider) : ISponsorReviewPacketBuilder
{
    private readonly IRunDetailQueryService _runDetailQueryService =
        runDetailQueryService ?? throw new ArgumentNullException(nameof(runDetailQueryService));

    private readonly ISponsorRoiSummaryService _SponsorRoiSummaryService =
        SponsorRoiSummaryService ?? throw new ArgumentNullException(nameof(SponsorRoiSummaryService));

    private readonly IArchitectureDecisionRegisterService _decisionRegisterService =
        decisionRegisterService ?? throw new ArgumentNullException(nameof(decisionRegisterService));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    public async Task<string?> BuildMarkdownAsync(string runId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        ArchitectureRunDetail? detail = await _runDetailQueryService.GetRunDetailAsync(runId.Trim(), cancellationToken);

        if (detail is null)
            return null;

        if (!detail.IsCommitted || detail.HasBrokenManifestReference)
            return null;

        SponsorRoiSummaryResponse roiSummary =
            await _SponsorRoiSummaryService.BuildAsync(cancellationToken).ConfigureAwait(false);

        IReadOnlyList<ArchitectureFinding> topFindings =
            ArchitectureReviewBoardExportDocumentFactory.SelectRunSummaryTopFindings(detail, maxCount: 5);

        List<string> topTitles = topFindings
            .Select(static f => string.IsNullOrWhiteSpace(f.Message) ? f.Category : f.Message.Trim())
            .ToList();

        string SponsorReport = BuildDeterministicSponsorReport(detail, topFindings);
        IReadOnlyList<SponsorReviewPacketDecisionRow> topDecisions = await BuildTopDecisionsAsync(cancellationToken)
            .ConfigureAwait(false);
        SponsorReviewPacketPortfolioSignals portfolioSignals =
            SponsorReviewPacketPortfolioSignalsFactory.Create(roiSummary);

        return SponsorReviewPacketComposer.ComposeMarkdown(
            detail,
            SponsorReport,
            topTitles,
            roiSummary,
            TimeProvider.System.UtcNowDateTime(),
            topDecisions,
            portfolioSignals);
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
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        ArchitectureDecisionRegisterResponse register = await _decisionRegisterService
            .GetRegisterAsync(scope.TenantId, scope.ProjectId, maxRows: 25, filters: null, cancellationToken)
            .ConfigureAwait(false);

        List<SponsorReviewPacketDecisionRow> rows = [];

        foreach (ArchitectureDecisionRegisterEntry entry in register.Decisions.Take(5))
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
