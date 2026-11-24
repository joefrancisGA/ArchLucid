using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Analysis;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Queries;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Authority;

public sealed partial class ExportsController
{
    private async Task<IActionResult?> EnsureSealedManifestReadAllowedAsync(
        string runId,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(runId, out Guid runGuid))
            return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        // Reuse the authoritative scoped architecture-sharing decision
        // BEFORE fetching any run detail or export content. Hash integrity is
        // complementary to sharing authorization; it cannot replace it.
        IActionResult? accessDenied = await _architectureShareAccessGate.EnsureRunReadAllowedAsync(
            this, User, scope, runGuid, cancellationToken);

        if (accessDenied is not null)
            return accessDenied;

        RunDetailDto? detail;

        try
        {
            detail = await _authorityQueryService.GetRunDetailAsync(scope, runGuid, cancellationToken);
        }
        catch (ConflictException ex)
        {
            return MapExportReplaySealedManifestConflict(ex);
        }

        if (detail?.GoldenManifest is null)
            return null;

        try
        {
            SealedManifestReadGuard.EnsureSealedManifestHashMatchesOrThrow(
                detail.GoldenManifest,
                runGuid.ToString("D"),
                _manifestHashService);
        }
        catch (ConflictException ex)
        {
            return MapExportReplaySealedManifestConflict(ex);
        }

        return null;
    }

    /// <summary>
    ///     Maps export replay <see cref="ConflictException" /> raised via sealed-manifest guards to OpenAPI **409**.
    /// </summary>
    private IActionResult MapExportReplaySealedManifestConflict(ConflictException ex) =>
        this.ConflictProblem(ex.Message, ProblemTypes.Conflict);

    private async Task<IActionResult?> EnsureSealedManifestReadAllowedForExportRecordAsync(
        string exportRecordId,
        IRunExportRecordRepository exportRecordRepository,
        CancellationToken cancellationToken)
    {
        string normalizedExportRecordId = RunExportRecordIdNormalizer.NormalizeRequired(exportRecordId);
        RunExportRecord? record = await exportRecordRepository.GetByIdAsync(normalizedExportRecordId, cancellationToken);

        if (record is null)
            return null; // The scoped facade returns the regular not-found result.

        // A persisted export record with no valid run linkage must never skip
        // the run-specific sharing check and fall through to a content reader.
        if (!Guid.TryParse(record.RunId, out _))
            return this.NotFoundProblem($"Export record '{normalizedExportRecordId}' was not found.",
                ProblemTypes.ResourceNotFound);

        return await EnsureSealedManifestReadAllowedAsync(record.RunId, cancellationToken);
    }
}
