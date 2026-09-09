using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Drafts;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Architecture;

public sealed partial class WizardIntakeDraftsController
{
    private async Task<IActionResult?> EnsureWizardIntakeDraftSealedManifestReadAllowedAsync(
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        try
        {
            await DraftIntakeSealedManifestReadGuard.EnsureDraftIntakeReadAllowedOrThrowAsync(
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
