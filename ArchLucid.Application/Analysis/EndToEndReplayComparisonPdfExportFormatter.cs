using ArchLucid.Application.Rendering;

using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace ArchLucid.Application.Analysis;

/// <summary>PDF export for <see cref="EndToEndReplayComparisonReport"/>.</summary>
public static class EndToEndReplayComparisonPdfExportFormatter
{
    public static Task<byte[]> GenerateAsync(
        IEndToEndReplayComparisonSummaryFormatter summaryFormatter,
        EndToEndReplayComparisonReport report,
        CancellationToken cancellationToken = default,
        string? profile = null)
    {
        ArgumentNullException.ThrowIfNull(summaryFormatter);
        ArgumentNullException.ThrowIfNull(report);
        cancellationToken.ThrowIfCancellationRequested();
        string p = EndToEndComparisonExportProfile.Normalize(profile);

        byte[] pdf = QuestPdfDocumentBytes.Generate(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.DefaultTextStyle(x => x.FontSize(10).FontFamily("Helvetica"));
                page.Header().Text("ArchLucid End-to-End Replay Comparison").Bold().FontSize(14);
                page.Content().Column(column =>
                {
                    column.Item().PaddingBottom(5).Text($"Left: {report.LeftRunId}  |  Right: {report.RightRunId}  |  Profile: {p}");
                    column.Item().PaddingBottom(10).Text($"Generated: {TimeProvider.System.UtcNowDateTime():O}");
                    column.Item().PaddingBottom(10).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);
                    column.Item().PaddingBottom(5).Text("Summary").Bold().FontSize(12);
                    column.Item().PaddingBottom(10).Text(summaryFormatter.FormatMarkdown(report).Trim());

                    if (EndToEndComparisonExportProfile.IsShort(p))
                    {
                        column.Item().PaddingTop(10).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);
                        column.Item().PaddingTop(5).Text("Interpretation Notes").Bold();
                    }
                    else
                    {
                        column.Item().PaddingTop(5).Text("Key counts").Bold().FontSize(12);
                        column.Item().Text(
                            $"Run metadata: {report.RunDiff.ChangedFields.Count} changed field(s); Request IDs differ: {(report.RunDiff.RequestIdsDiffer ? "Yes" : "No")}");

                        if (report.AgentResultDiff is not null)
                        {
                            int withChanges = report.AgentResultDiff.AgentDeltas.Count(d =>
                                d.AddedClaims.Count > 0 || d.RemovedClaims.Count > 0 || d.AddedFindings.Count > 0 || d.RemovedFindings.Count > 0 ||
                                d.AddedRequiredControls.Count > 0 || d.RemovedRequiredControls.Count > 0 || d.AddedWarnings.Count > 0 ||
                                d.RemovedWarnings.Count > 0);

                            column.Item().Text($"Agent deltas: {withChanges} agent(s) with material changes");
                        }

                        if (report.ManifestDiff is not null)
                            column.Item().Text(
                                $"Manifest: +{report.ManifestDiff.AddedServices.Count} / -{report.ManifestDiff.RemovedServices.Count} services; +{report.ManifestDiff.AddedDatastores.Count} / -{report.ManifestDiff.RemovedDatastores.Count} datastores");

                        column.Item().Text($"Export diffs: {report.ExportDiffs.Count}");

                        if (report.CompareQualityDelta is not null)
                        {
                            foreach (CompareQualityDeltaExportFormatter.CompareQualityDeltaExportRow row in
                                     CompareQualityDeltaExportFormatter.BuildRows(report.CompareQualityDelta))
                            {
                                column.Item().Text($"{row.Label}: before {row.Before}, after {row.After}");
                            }
                        }

                        column.Item().PaddingTop(10).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);
                        column.Item().PaddingTop(5).Text("Interpretation Notes").Bold();
                    }

                    foreach (string note in report.InterpretationNotes)
                        column.Item().Text($"• {note}");

                    column.Item().PaddingTop(5).Text("Warnings").Bold();

                    foreach (string w in report.Warnings)
                        column.Item().Text($"• {w}");
                });
            });
        });

        return Task.FromResult(pdf);
    }
}
