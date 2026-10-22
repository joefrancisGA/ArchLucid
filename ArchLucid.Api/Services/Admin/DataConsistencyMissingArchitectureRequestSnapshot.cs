using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Api.Services.Admin;

/// <summary>
/// Detection-only count and sample of runs whose ArchitectureRequestId is missing from
/// dbo.ArchitectureRequests (grace-aged; same predicate as auto-remediation).
/// </summary>
[ExcludeFromCodeCoverage(Justification = "API request/response DTO; auto-properties only.")]
public sealed record DataConsistencyMissingArchitectureRequestSnapshot(
    long Count,
    IReadOnlyList<string> SampleRunIds);
