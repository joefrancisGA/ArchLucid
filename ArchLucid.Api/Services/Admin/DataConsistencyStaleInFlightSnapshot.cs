using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Api.Services.Admin;

/// <summary>
/// Detection-only stale in-flight run count and sample ids (same predicate as reconciliation
/// <c>stale_in_flight_runs</c>).
/// </summary>
[ExcludeFromCodeCoverage(Justification = "API request/response DTO; auto-properties only.")]
public sealed record DataConsistencyStaleInFlightSnapshot(
    long Count,
    IReadOnlyList<string> SampleRunIds);
