using ArchLucid.Contracts.Roi;

namespace ArchLucid.Application.Roi;

/// <summary>Builds executive ROI board-pack artifacts (Markdown/PDF) without LLM calls.</summary>
public interface IExecutiveRoiBoardPackExporter
{
    Task<ExecutiveRoiBoardPackExportResult> ExportAsync(
        ExecutiveRoiBoardPackFormat format,
        string? traceId,
        CancellationToken cancellationToken = default);
}
