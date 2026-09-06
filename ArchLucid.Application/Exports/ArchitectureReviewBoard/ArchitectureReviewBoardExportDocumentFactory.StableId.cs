using System.Security.Cryptography;
using System.Text;

using ArchLucid.Application.Bootstrap;
using ArchLucid.Application.Exports;
using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Manifest;

namespace ArchLucid.Application.Exports.ArchitectureReviewBoard;

public static partial class ArchitectureReviewBoardExportDocumentFactory
{
    /// <summary>
    ///     Stable surrogate identifier derived from <paramref name="runId" /> for continuity across DOCX/PDF exports.
    /// </summary>
    public static Guid CreateStableReviewId(string runId)
    {
        if (string.IsNullOrWhiteSpace(runId))
            throw new ArgumentException("Run id is required.", nameof(runId));

        if (Guid.TryParse(runId, out Guid parsed))
            return parsed;

        if (runId.Length >= 32 && Guid.TryParseExact(runId[..32], "N", out Guid parsedN))
            return parsedN;

        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(runId.Trim()));

        return new Guid(hash.AsSpan(0, 16), true);
    }

    /// <summary>Builds the sponsor one-pager model (severity counts + AI summary + top finding titles).</summary>
    public static RunSummaryOnePagerDocumentModel CreateRunSummaryOnePager(
        ArchitectureRunDetail detail,
        string SponsorReport,
        IReadOnlyList<string> topFindingTitles,
        string? activeTrialExportNotice = null,
        string? careerExportHonestyPlainText = null)
        => RunSummaryOnePagerDocumentFactory.Create(
            detail,
            SponsorReport,
            topFindingTitles,
            activeTrialExportNotice,
            careerExportHonestyPlainText: careerExportHonestyPlainText);

    /// <summary>Selects top High/Critical findings for the one-pager LLM prompt.</summary>
    public static IReadOnlyList<ArchitectureFinding> SelectRunSummaryTopFindings(ArchitectureRunDetail detail, int maxCount)
        => RunSummaryOnePagerDocumentFactory.SelectTopHighCriticalFindings(detail, maxCount);

    public static ArchitectureReviewBoardExportDocumentModel Create(
        ArchitectureRunDetail detail,
        ArchitectureAnalysisReport report,
        string? httpCorrelationId,
        string? extractorTimestampUtcLabel,
        bool? isDemoTenant = null,
        string? tenantDisplayName = null,
        string? explanationConfidenceCallout = null,
        string? careerExportHonestyPlainText = null)
    {
        ArgumentNullException.ThrowIfNull(detail);
        ArgumentNullException.ThrowIfNull(report);

        string runId = detail.Run.RunId ?? string.Empty;
        bool demo = isDemoTenant
                    ?? (ContosoRetailDemoIdentifiers.IsDemoRunId(runId)
                        || ContosoRetailDemoIdentifiers.IsDemoRequestId(detail.Run.RequestId));
        (string? executionModeNoticeTitle, string? executionModeNoticeBody) =
            BoardExportExecutionModeNoticeResolver.TryGetNotice(detail.Run);

        return new ArchitectureReviewBoardExportDocumentModel
        {
            ReviewId = CreateStableReviewId(runId),
            RunId = runId,
            RequestId = detail.Run.RequestId,
            SystemName = report.Manifest?.SystemName ?? report.Evidence?.SystemName ?? detail.Manifest?.SystemName,
            ManifestVersion = detail.Run.CurrentManifestVersion ?? detail.Manifest?.Metadata.ManifestVersion,
            SponsorReport = report.Summary,
            HttpCorrelationId = httpCorrelationId,
            ExtractorTimestampUtcLabel = extractorTimestampUtcLabel,
            SystemOverviewBullets = BuildSystemOverviewBullets(detail, report),
            EvidenceReviewed = BuildEvidenceReviewed(report),
            ArchitectureDecisions = BuildArchitectureDecisions(detail),
            KeyRisks = BuildKeyRisks(report, detail),
            PolicyFindings = BuildPolicyFindings(detail),
            AiDispositionFindings = BuildAiDisposition(report),
            TraceabilityLines = BuildExtraTraceLines(detail),
            RecommendedNextActions = BuildRecommendedActions(report, detail),
            IsDemoTenant = demo,
            TenantDisplayName = string.IsNullOrWhiteSpace(tenantDisplayName) ? null : tenantDisplayName.Trim(),
            ExplanationConfidenceCallout = string.IsNullOrWhiteSpace(explanationConfidenceCallout)
                ? null
                : explanationConfidenceCallout.Trim(),
            SimulatorRehearsalTitle = executionModeNoticeTitle,
            SimulatorRehearsalBody = executionModeNoticeBody,
            CareerExportHonestyPlainText = string.IsNullOrWhiteSpace(careerExportHonestyPlainText)
                ? null
                : careerExportHonestyPlainText.Trim(),
        };
    }
}
