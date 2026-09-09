using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Architecture;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Architecture;

public sealed partial class ArchitecturesController
{
    private async Task<IActionResult?> EnsureArchitectureIdentitySealedManifestReadAllowedAsync(
        ScopeContext scope,
        Guid architectureId,
        Guid? latestSealedManifestId,
        CancellationToken cancellationToken)
    {
        try
        {
            await ArchitectureIdentitySealedManifestReadGuard.EnsureLatestSealedManifestReadAllowedOrThrowAsync(
                scope,
                architectureId,
                latestSealedManifestId,
                _runRepository,
                _goldenManifestRepository,
                _manifestHashService,
                cancellationToken);
        }
        catch (ConflictException ex)
        {
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }

        return null;
    }

    private async Task<IActionResult?> EnsureArchitectureIdentityListSealedManifestReadAllowedAsync(
        ScopeContext scope,
        ArchitectureIdentityListPage page,
        CancellationToken cancellationToken)
    {
        foreach (ArchitectureIdentityListItem item in page.Items)
        {
            IActionResult? guardResult = await EnsureArchitectureIdentitySealedManifestReadAllowedAsync(
                scope,
                item.ArchitectureId,
                item.LatestSealedManifestId,
                cancellationToken);

            if (guardResult is not null)
                return guardResult;
        }

        return null;
    }

    private async Task<IActionResult?> EnsureArchitectureSealDeltaSealedManifestReadAllowedAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken)
    {
        try
        {
            await ArchitectureSealDeltaSealedManifestReadGuard.EnsureSealDeltaReadAllowedOrThrowAsync(
                scope,
                architectureId,
                _architectureIdentityService,
                _runRepository,
                _goldenManifestRepository,
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
