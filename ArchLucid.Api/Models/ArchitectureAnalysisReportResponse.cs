using System.Diagnostics.CodeAnalysis;

using ArchLucid.Application.Analysis;

namespace ArchLucid.Api.Models;

[ExcludeFromCodeCoverage(Justification = "API request/response DTO; no business logic.")]
public sealed class ArchitectureAnalysisReportResponse
{
    public ArchitectureAnalysisReport Report { get; set; } = new();
}
