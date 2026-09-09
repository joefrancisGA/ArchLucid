using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Roi;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Roi;

public sealed partial class RoiController
{
    private async Task<IActionResult?> EnsureSponsorRoiSealedManifestReadAllowedAsync(
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        try
        {
            SponsorRoiSummaryResponse summary =
                await _sponsorRoiSummaryService.BuildAsync(cancellationToken).ConfigureAwait(false);

            await SponsorRoiBoardPackSealedManifestGuard.EnsureSummaryRunsSealedOrThrowAsync(
                summary,
                scope,
                _authorityQueryService,
                _manifestHashService,
                cancellationToken).ConfigureAwait(false);
        }
        catch (ConflictException ex)
        {
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }

        return null;
    }

    private async Task<IActionResult?> EnsureCrossTenantPortfolioSealedManifestReadAllowedAsync(
        string userDirectoryKey,
        CancellationToken cancellationToken)
    {
        try
        {
            ScopeContext scope = _scopeProvider.GetCurrentScope();

            await CrossTenantPortfolioSealedManifestGuard.EnsureAccessiblePortfolioRunsSealedOrThrowAsync(
                userDirectoryKey,
                scope,
                _tenantRepository,
                _scimUserRepository,
                _runCollector,
                _authorityQueryService,
                _manifestHashService,
                cancellationToken).ConfigureAwait(false);
        }
        catch (ConflictException ex)
        {
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }

        return null;
    }
}
