using ArchLucid.Contracts.Exports;

using DocumentFormat.OpenXml.Wordprocessing;

namespace ArchLucid.Application.Exports.ArchitectureReviewBoard;

public sealed partial class ArchitectureReviewDocxBuilder
{
    internal void AddTraceabilityAppendixSection(Body body, ArchitectureReviewBoardExportDocumentModel model)
    {
        ArchitectureReviewDocxOpenXmlPrimitives.AddHeading1(body, "Traceability appendix");

        List<(string Key, string Value)> rows =
        [
            ("HTTP correlation ID", string.IsNullOrWhiteSpace(model.HttpCorrelationId)
                ? ArchitectureReviewBoardExportHonestyCopy.HttpCorrelationIdNotStored
                : model.HttpCorrelationId.Trim()),
            ("Architecture snapshot version", string.IsNullOrWhiteSpace(model.ManifestVersion)
                ? ArchitectureReviewBoardExportHonestyCopy.ManifestVersionNotStored
                : model.ManifestVersion.Trim()),
            ("Extractor timestamp (UTC)", string.IsNullOrWhiteSpace(model.ExtractorTimestampUtcLabel)
                ? ArchitectureReviewBoardExportHonestyCopy.ExtractorTimestampNotStored
                : model.ExtractorTimestampUtcLabel.Trim()),
        ];

        foreach (ArchitectureReviewBoardExportTraceRow line in model.TraceabilityLines ?? [])
        {
            if (string.IsNullOrWhiteSpace(line.Label))
                continue;

            rows.Add((line.Label.Trim(), string.IsNullOrWhiteSpace(line.Value) ? "Value was not stored" : line.Value.Trim()));
        }

        if (rows.Count == 0)
            ArchitectureReviewDocxOpenXmlPrimitives.AddEmptyPlaceholder(body, "traceability references");
        else
            ArchitectureReviewDocxOpenXmlPrimitives.AddKeyValueTable(body, rows);
    }
}
