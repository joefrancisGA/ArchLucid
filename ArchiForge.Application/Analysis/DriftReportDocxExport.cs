namespace ArchiForge.Application.Analysis;

public sealed class DriftReportDocxExport
{
    public byte[] GenerateDocx(DriftAnalysisResult drift, string? comparisonRecordId = null)
    {
        using var builder = new OpenXmlDocxDocumentBuilder();
        builder.AddHeading("ArchiForge Comparison Drift Report", 1);
        if (!string.IsNullOrWhiteSpace(comparisonRecordId))
        {
            builder.AddParagraph($"Comparison record: {comparisonRecordId}");
            builder.AddSpacer();
        }
        builder.AddParagraph($"Drift detected: {(drift.DriftDetected ? "Yes" : "No")}");
        if (!string.IsNullOrWhiteSpace(drift.Summary))
            builder.AddParagraph(drift.Summary);
        builder.AddSpacer();
        if (drift.Items.Count > 0)
        {
            builder.AddHeading("Differences", 2);
            foreach (var item in drift.Items)
            {
                builder.AddParagraph($"{item.Category} — {item.Path}", bold: true);
                if (!string.IsNullOrEmpty(item.Description))
                    builder.AddParagraph(item.Description);
                if (item.StoredValue != null || item.RegeneratedValue != null)
                {
                    if (item.StoredValue != null)
                        builder.AddBullet($"Stored: {item.StoredValue}");
                    if (item.RegeneratedValue != null)
                        builder.AddBullet($"Regenerated: {item.RegeneratedValue}");
                }
            }
            builder.AddSpacer();
        }
        return builder.Build();
    }
}
