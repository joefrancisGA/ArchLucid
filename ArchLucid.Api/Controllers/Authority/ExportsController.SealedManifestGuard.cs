using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
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
            return null;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
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
        RunExportRecord? record = await exportRecordRepository.GetByIdAsync(exportRecordId, cancellationToken);

        if (record is null || string.IsNullOrWhiteSpace(record.RunId))
            return null;

        return await EnsureSealedManifestReadAllowedAsync(record.RunId, cancellationToken);
    }
}
