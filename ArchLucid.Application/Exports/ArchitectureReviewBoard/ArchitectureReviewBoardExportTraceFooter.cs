namespace ArchLucid.Application.Exports.ArchitectureReviewBoard;

/// <summary>
///     Shared footer trace line for architecture review board DOCX/PDF exports (RunId + export timestamp).
/// </summary>
public static class ArchitectureReviewBoardExportTraceFooter
{
    public static string ComposeTraceLine(string runId, DateTimeOffset exportTimestampUtc)
    {
        if (string.IsNullOrWhiteSpace(runId))
            throw new ArgumentException("RunId is required.", nameof(runId));

        return $"Run ID: {runId.Trim()} · Exported UTC: {exportTimestampUtc:O}";
    }

    public static string ComposePageFooterText(
        string baseFooter,
        string runId,
        DateTimeOffset exportTimestampUtc,
        string? activeTrialExportNotice)
    {
        string withTrace = string.IsNullOrWhiteSpace(baseFooter)
            ? ComposeTraceLine(runId, exportTimestampUtc)
            : $"{baseFooter} · {ComposeTraceLine(runId, exportTimestampUtc)}";

        return ArchitectureReviewPdfBuilder.ComposePageFooterText(withTrace, activeTrialExportNotice);
    }
}
