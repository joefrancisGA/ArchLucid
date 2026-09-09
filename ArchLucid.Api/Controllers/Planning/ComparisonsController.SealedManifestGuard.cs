using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Queries;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Planning;

public sealed partial class ComparisonsController
{
    private async Task<IActionResult?> EnsureSealedManifestReadAllowedAsync(
        string runId,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(runId, out Guid runGuid))
            return null;

        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        RunDetailDto? detail = await authorityQueryService.GetRunDetailAsync(scope, runGuid, cancellationToken);

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
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }

        return null;
    }

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

    private async Task<IActionResult?> EnsureSealedManifestReadAllowedForComparisonRecordAsync(
        ComparisonRecord record,
        CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(record.LeftRunId))
        {
            IActionResult? leftGuardResult =
                await EnsureSealedManifestReadAllowedAsync(record.LeftRunId, cancellationToken);

            if (leftGuardResult is not null)
                return leftGuardResult;
        }

        if (!string.IsNullOrWhiteSpace(record.RightRunId))
        {
            IActionResult? rightGuardResult =
                await EnsureSealedManifestReadAllowedAsync(record.RightRunId, cancellationToken);

            if (rightGuardResult is not null)
                return rightGuardResult;
        }

        return null;
    }
}
