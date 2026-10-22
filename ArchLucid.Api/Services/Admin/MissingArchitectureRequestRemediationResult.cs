using System.Diagnostics.CodeAnalysis;

using ArchLucid.Persistence.Models;

namespace ArchLucid.Api.Services.Admin;

/// <summary>
/// Result of <see cref="IAdminDiagnosticsService.RemediateMissingArchitectureRequestRunsAsync" />.
/// Soft-archives candidates; does not set <c>Failed</c>.
/// </summary>
[ExcludeFromCodeCoverage(Justification = "API request/response DTO; auto-properties only.")]
public sealed record MissingArchitectureRequestRemediationResult(
    bool DryRun,
    int CandidateCount,
    IReadOnlyList<string> CandidateRunIds,
    IReadOnlyList<string> ArchivedRunIds,
    IReadOnlyList<RunArchiveByIdFailure> Failed);
