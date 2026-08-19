using ArchLucid.Contracts.Roi;

namespace ArchLucid.Application.Roi;

/// <summary>Builds sponsor ROI board-pack artifacts (Markdown/PDF) without LLM calls.</summary>
public interface ISponsorRoiBoardPackExporter
{
    Task<SponsorRoiBoardPackExportResult> ExportAsync(
        SponsorRoiBoardPackFormat format,
        string? traceId,
        bool generateNarrative = false,
        CancellationToken cancellationToken = default);
}
