using ArchLucid.Application.Exports.ArchitectureReviewBoard;

namespace ArchLucid.Application.Tests.Exports.ArchitectureReviewBoard;

/// <summary>
///     Stable <see cref="ArchitectureReviewBoardExportDocumentModel" /> seeds for export structure tests.
/// </summary>
internal static class ArchitectureReviewBoardExportTestModels
{
    internal static readonly Guid StableGoldenReviewId = Guid.Parse("c3333333-3333-3333-3333-333333333333");

    internal const string StableGoldenRunId = "golden-architecture-review-board-run-001";

    /// <summary>Populates every section list so DOCX/PDF emit non-placeholder body content.</summary>
    internal static ArchitectureReviewBoardExportDocumentModel CreateFullyPopulatedModel()
    {
        return new ArchitectureReviewBoardExportDocumentModel
        {
            ReviewId = StableGoldenReviewId,
            RunId = StableGoldenRunId,
            RequestId = "golden-req-001",
            SystemName = "Golden Corp Payments",
            ManifestVersion = "golden-mv-42",
            ExecutiveSummary = "Stable executive summary paragraph for golden exports.",
            SystemOverviewBullets = ["First overview bullet for golden seed.", "Second overview bullet."],
            EvidenceReviewed =
            [
                new ArchitectureReviewBoardExportEvidenceItem { Title = "Design memo", Detail = "ADR-12 captures boundaries.", Reference = "DOC-9" }
            ],
            ArchitectureDecisions =
            [
                new ArchitectureReviewBoardExportDecisionRow
                {
                    Title = "ADR-12 Boundary",
                    Detail = "Service owns intake workflow.",
                    RecordedAtUtcLabel = "2026-05-16T10:00:00Z"
                }
            ],
            KeyRisks =
            [
                new ArchitectureReviewBoardExportRiskRow { SeverityLabel = "High", Summary = "Latency SLO at risk.", Detail = "Checkout dependency chain." }
            ],
            PolicyFindings =
            [
                new ArchitectureReviewBoardExportPolicyFindingRow { PolicyPackNameOrId = "SOC2", Outcome = "Pass", Detail = "Encryption enforced." }
            ],
            AiDispositionFindings =
            [
                new ArchitectureReviewBoardExportDispositionItem { Summary = "Model flagged anomaly.", Context = "Needs human review." }
            ],
            TraceabilityLines =
            [
                new ArchitectureReviewBoardExportTraceRow { Label = "Build identifier", Value = "golden-build-7" }
            ],
            RecommendedNextActions = ["Action one for golden seed.", "Action two."],
            HttpCorrelationId = "golden-corr-xyz",
            ExtractorTimestampUtcLabel = "2026-05-16T15:30:00Z"
        };
    }

    /// <summary>Minimal model: empty optional sections exercise placeholder strings.</summary>
    internal static ArchitectureReviewBoardExportDocumentModel CreateEmptySectionsModel()
    {
        return new ArchitectureReviewBoardExportDocumentModel
        {
            ReviewId = Guid.Parse("d4444444-4444-4444-4444-444444444444"),
            RunId = "empty-sections-run-001",
            ExecutiveSummary = null,
            SystemOverviewBullets = [],
            EvidenceReviewed = [],
            ArchitectureDecisions = [],
            KeyRisks = [],
            PolicyFindings = [],
            AiDispositionFindings = [],
            TraceabilityLines = [],
            RecommendedNextActions = []
        };
    }

    internal static IReadOnlyList<string> LoadGoldenSectionHeadingOrder()
    {
        string path = Path.Combine(AppContext.BaseDirectory, "Exports", "ArchitectureReviewBoard", "Golden",
            "architecture-review-board-section-headings-order.txt");

        if (!File.Exists(path))
            throw new FileNotFoundException($"Golden headings file not found at '{path}'. Ensure CopyToOutputDirectory is set.");

        return File.ReadAllLines(path).Select(static line => line.Trim()).Where(static line => line.Length > 0).ToArray();
    }
}
