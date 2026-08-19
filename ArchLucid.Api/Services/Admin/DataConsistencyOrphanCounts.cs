using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Api.Services.Admin;

/// <summary>Detection-only orphan row counts (same queries as the background orphan probe).</summary>
[ExcludeFromCodeCoverage(Justification = "API request/response DTO; auto-properties only.")]
public sealed record DataConsistencyOrphanCounts(
    long ComparisonRecordsLeftRunIdOrphans,
    long ComparisonRecordsRightRunIdOrphans,
    long GoldenManifestsRunIdOrphans,
    long FindingsSnapshotsRunIdOrphans,
    long ContextSnapshotsRunIdOrphans,
    long GraphSnapshotsRunIdOrphans);
