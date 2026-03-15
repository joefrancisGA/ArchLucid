using ArchiForge.Application.Analysis;

namespace ArchiForge.Api.Models;

public sealed class ArchitectureAnalysisReportResponse
{
    public ArchitectureAnalysisReport Report { get; set; } = new();
}
