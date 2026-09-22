using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Analysis;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Admin;

public sealed partial class AuditController
{
    private async Task<IActionResult?> EnsureAuditExportSealedManifestAllowedAsync(
        Guid? runId,
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        if (runId is null || runId.Value == Guid.Empty)
            return null;

        try
        {
            await RunExportSealedManifestHashGuard.EnsureRunSealedManifestHashOrThrowAsync(
                runId.Value.ToString("N"),
                scope,
                authorityQueryService,
                manifestHashService,
                cancellationToken);
        }
        catch (ConflictException ex)
        {
            return MapAuditExportSealedManifestConflict(ex);
        }

        return null;
    }

    /// <summary>
    ///     Maps audit export <see cref="ConflictException" /> raised via sealed-manifest guards to OpenAPI **409**.
    /// </summary>
    private IActionResult MapAuditExportSealedManifestConflict(ConflictException ex) =>
        this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
}
