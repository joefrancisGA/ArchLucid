namespace ArchLucid.Application.Exports.ArchitectureReviewBoard;

/// <summary>
///     Canonical section order and headings for architecture-review-board sponsor exports.
/// </summary>
public static class ArchitectureReviewBoardExportSectionCatalog
{
    public static readonly ArchitectureReviewBoardExportSectionKind[] BodySectionOrder =
    [
        ArchitectureReviewBoardExportSectionKind.SponsorReport,
        ArchitectureReviewBoardExportSectionKind.SystemOverview,
        ArchitectureReviewBoardExportSectionKind.EvidenceReviewed,
        ArchitectureReviewBoardExportSectionKind.ArchitectureDecisions,
        ArchitectureReviewBoardExportSectionKind.KeyRisks,
        ArchitectureReviewBoardExportSectionKind.PolicyFindings,
        ArchitectureReviewBoardExportSectionKind.AiAssistedAnalysis,
        ArchitectureReviewBoardExportSectionKind.TraceabilityAppendix,
        ArchitectureReviewBoardExportSectionKind.RecommendedNextActions,
    ];

    public static string GetHeading(ArchitectureReviewBoardExportSectionKind kind) =>
        kind switch
        {
            ArchitectureReviewBoardExportSectionKind.SponsorReport => "Sponsor report",
            ArchitectureReviewBoardExportSectionKind.SystemOverview => "System overview (architecture snapshot)",
            ArchitectureReviewBoardExportSectionKind.EvidenceReviewed => "Evidence reviewed",
            ArchitectureReviewBoardExportSectionKind.ArchitectureDecisions => "Architecture decisions",
            ArchitectureReviewBoardExportSectionKind.KeyRisks => "Key risks",
            ArchitectureReviewBoardExportSectionKind.PolicyFindings => "Policy findings",
            ArchitectureReviewBoardExportSectionKind.AiAssistedAnalysis => "AI-assisted analysis",
            ArchitectureReviewBoardExportSectionKind.TraceabilityAppendix => "Traceability appendix",
            ArchitectureReviewBoardExportSectionKind.RecommendedNextActions => "Recommended next actions",
            _ => throw new ArgumentOutOfRangeException(nameof(kind), kind, "Unknown export section kind."),
        };

    public static IReadOnlyList<string> OrderedHeadings { get; } =
        BodySectionOrder.Select(GetHeading).ToList();
}
