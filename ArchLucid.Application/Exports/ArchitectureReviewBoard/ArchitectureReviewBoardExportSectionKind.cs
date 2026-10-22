namespace ArchLucid.Application.Exports.ArchitectureReviewBoard;

/// <summary>
///     Ordered body sections shared by architecture-review-board PDF and DOCX export renderers.
/// </summary>
public enum ArchitectureReviewBoardExportSectionKind
{
    SponsorReport,
    SystemOverview,
    EvidenceReviewed,
    ArchitectureDecisions,
    KeyRisks,
    PolicyFindings,
    AiAssistedAnalysis,
    TraceabilityAppendix,
    RecommendedNextActions,
}
