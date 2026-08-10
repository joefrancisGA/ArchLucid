using System.Diagnostics.CodeAnalysis;

using ArchLucid.Persistence.Models;

namespace ArchLucid.Api.Services.Admin;

/// <summary>
/// Result of <see cref="IAdminDiagnosticsService.RemediateStaleInFlightRunsAsync" />.
/// Soft-archives candidates; does not set <c>Failed</c> (avoids CHECK conflicts when headers already hold manifests).
/// </summary>
[ExcludeFromCodeCoverage(Justification = "API request/response DTO; auto-properties only.")]
public sealed record StaleInFlightRemediationResult(
    bool DryRun,
    int CandidateCount,
    IReadOnlyList<string> CandidateRunIds,
    IReadOnlyList<string> ArchivedRunIds,
    IReadOnlyList<RunArchiveByIdFailure> Failed);
