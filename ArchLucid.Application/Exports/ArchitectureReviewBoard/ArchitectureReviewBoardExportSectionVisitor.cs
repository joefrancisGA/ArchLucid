namespace ArchLucid.Application.Exports.ArchitectureReviewBoard;

/// <summary>
///     Walks the shared architecture-review-board export section model in canonical order.
/// </summary>
public static class ArchitectureReviewBoardExportSectionVisitor
{
    public static void VisitBodySections(Action<ArchitectureReviewBoardExportSectionKind, bool> renderSection)
    {
        bool firstMajorHeading = true;

        foreach (ArchitectureReviewBoardExportSectionKind kind in ArchitectureReviewBoardExportSectionCatalog.BodySectionOrder)
        {
            renderSection(kind, firstMajorHeading);
            firstMajorHeading = false;
        }
    }
}
