using ArchLucid.Contracts.Exports;

using DocumentFormat.OpenXml.Wordprocessing;

namespace ArchLucid.Application.Exports.ArchitectureReviewBoard;

public sealed partial class ArchitectureReviewDocxBuilder
{
    internal void AddTraceabilityAppendixSection(Body body, ArchitectureReviewBoardExportDocumentModel model)
    {
        ArchitectureReviewDocxOpenXmlPrimitives.AddHeading1(body, "Traceability appendix");

        List<(string Key, string Value)> rows = [];

        if (!string.IsNullOrWhiteSpace(model.HttpCorrelationId))
            rows.Add(("HTTP correlation ID", model.HttpCorrelationId.Trim()));

        if (!string.IsNullOrWhiteSpace(model.ManifestVersion))
            rows.Add(("Architecture snapshot version", model.ManifestVersion.Trim()));

        if (!string.IsNullOrWhiteSpace(model.ExtractorTimestampUtcLabel))
            rows.Add(("Extractor timestamp (UTC)", model.ExtractorTimestampUtcLabel.Trim()));

        foreach (ArchitectureReviewBoardExportTraceRow line in model.TraceabilityLines ?? [])
        {
            if (string.IsNullOrWhiteSpace(line.Label))
                continue;

            rows.Add((line.Label.Trim(), string.IsNullOrWhiteSpace(line.Value) ? "—" : line.Value.Trim()));
        }

        if (rows.Count == 0)
            ArchitectureReviewDocxOpenXmlPrimitives.AddEmptyPlaceholder(body, "traceability references");
        else
            ArchitectureReviewDocxOpenXmlPrimitives.AddKeyValueTable(body, rows);
    }
}
