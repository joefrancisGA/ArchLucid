namespace ArchiForge.Application.Analysis;

public interface IDriftReportFormatter
{
    string FormatMarkdown(DriftAnalysisResult drift, string? comparisonRecordId = null);

    string FormatHtml(DriftAnalysisResult drift, string? comparisonRecordId = null);
}
