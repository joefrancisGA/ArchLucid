using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Authority;

public sealed partial class AuthorityReadsController
{
    private async Task<IActionResult?> EnsureRunInventorySealedManifestReadAllowedAsync(
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        try
        {
            await RunInventorySealedManifestReadGuard.EnsureRunInventoryReadAllowedOrThrowAsync(
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                _runDetailQueryService,
                _authorityQueryService,
                _manifestHashService,
                cancellationToken);
        }
        catch (ConflictException ex)
        {
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }

        return null;
    }
}
