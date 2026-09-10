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
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }

        return null;
    }
}
