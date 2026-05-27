using ArchLucid.Application.Exports.ArchitectureReviewBoard;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Exports;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Roi;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Exports;

/// <summary>One-click sponsor packet: manifest summary, findings, ROI basis labels, decisions, portfolio signals.</summary>
public sealed class ExecutiveReviewPacketBuilder(
    IRunDetailQueryService runDetailQueryService,
    IExecutiveRoiSummaryService executiveRoiSummaryService,
    IArchitectureDecisionRegisterService decisionRegisterService,
    IScopeContextProvider scopeContextProvider) : IExecutiveReviewPacketBuilder
{
    private readonly IRunDetailQueryService _runDetailQueryService =
        runDetailQueryService ?? throw new ArgumentNullException(nameof(runDetailQueryService));

    private readonly IExecutiveRoiSummaryService _executiveRoiSummaryService =
        executiveRoiSummaryService ?? throw new ArgumentNullException(nameof(executiveRoiSummaryService));

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

        ExecutiveRoiSummaryResponse roiSummary =
            await _executiveRoiSummaryService.BuildAsync(cancellationToken).ConfigureAwait(false);

        IReadOnlyList<ArchitectureFinding> topFindings =
            ArchitectureReviewBoardExportDocumentFactory.SelectRunSummaryTopFindings(detail, maxCount: 5);

        List<string> topTitles = topFindings
            .Select(static f => string.IsNullOrWhiteSpace(f.Message) ? f.Category : f.Message.Trim())
            .ToList();

        string executiveSummary = BuildDeterministicExecutiveSummary(detail, topFindings);
        IReadOnlyList<ExecutiveReviewPacketDecisionRow> topDecisions = await BuildTopDecisionsAsync(cancellationToken)
            .ConfigureAwait(false);
        ExecutiveReviewPacketPortfolioSignals portfolioSignals = BuildPortfolioSignals(roiSummary);

        return ExecutiveReviewPacketComposer.ComposeMarkdown(
            detail,
            executiveSummary,
            topTitles,
            roiSummary,
            TimeProvider.System.UtcNowDateTime(),
            topDecisions,
            portfolioSignals);
    }

    private static string BuildDeterministicExecutiveSummary(
        ArchitectureRunDetail detail,
        IReadOnlyList<ArchitectureFinding> topFindings)
    {
        int critical = topFindings.Count(static f =>
            string.Equals(f.Severity.ToString(), "Critical", StringComparison.OrdinalIgnoreCase));
        int high = topFindings.Count(static f =>
            string.Equals(f.Severity.ToString(), "High", StringComparison.OrdinalIgnoreCase));

        string systemName = detail.Manifest?.SystemName ?? detail.Run.RunId;

        return
            $"Architecture review for {systemName} is committed with {critical} critical and {high} high findings in the top set. "
            + "Use the ROI basis by disposition section to separate estimated potential from realized remediated value before sponsor sign-off.";
    }

    private async Task<IReadOnlyList<ExecutiveReviewPacketDecisionRow>> BuildTopDecisionsAsync(
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        ArchitectureDecisionRegisterResponse register = await _decisionRegisterService
            .GetRegisterAsync(scope.TenantId, scope.ProjectId, maxRows: 25, filters: null, cancellationToken)
            .ConfigureAwait(false);

        List<ExecutiveReviewPacketDecisionRow> rows = [];

        foreach (ArchitectureDecisionRegisterEntry entry in register.Decisions.Take(5))
        {
            rows.Add(new ExecutiveReviewPacketDecisionRow
            {
                Title = entry.Title,
                SelectedOption = entry.SelectedOption,
                ConfidenceLabel = entry.BuyerConfidenceSource ?? entry.ConfidenceSource,
                EvidenceHref = "/governance/decision-register",
            });
        }

        return rows;
    }

    private static ExecutiveReviewPacketPortfolioSignals BuildPortfolioSignals(ExecutiveRoiSummaryResponse roiSummary)
    {
        List<string> nextActions = [];

        if (roiSummary.BasisBreakdown?.DeferredUsd > 0m)
            nextActions.Add("Review deferred findings before the next architecture board cycle.");

        if (roiSummary.BasisBreakdown?.WaivedUsd > 0m)
            nextActions.Add("Confirm active waivers remain within policy before sponsor distribution.");

        if (nextActions.Count == 0)
            nextActions.Add("Confirm EA-adjusted savings assumptions with FinOps before sponsor sign-off.");

        return new ExecutiveReviewPacketPortfolioSignals
        {
            ResolvedFindingsCount30Days = roiSummary.ResolvedFindingsCount30Days,
            NewlyDiscoveredFindingsCount30Days = roiSummary.NewlyDiscoveredFindingsCount30Days,
            StaleRiskCount = 0,
            ExpiringWaiversCount14Days = roiSummary.RealizedValue?.ActiveWaiversCount ?? 0,
            NextActions = nextActions,
        };
    }
}
