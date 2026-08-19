namespace ArchLucid.Contracts.ValueReports;

/// <summary>One line in the review-cycle section (shared by DOCX and Markdown).</summary>
public sealed record ValueReportReviewCycleParagraph(
    string Text,
    bool Bold,
    bool Italic,
    int FontSizeHalfPoints);
