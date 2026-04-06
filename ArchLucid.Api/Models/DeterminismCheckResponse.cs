using System.Diagnostics.CodeAnalysis;

using ArchLucid.Application.Determinism;

namespace ArchLucid.Api.Models;

[ExcludeFromCodeCoverage(Justification = "API request/response DTO; no business logic.")]
public sealed class DeterminismCheckResponse
{
    public DeterminismCheckResult Result { get; set; } = new();
}
