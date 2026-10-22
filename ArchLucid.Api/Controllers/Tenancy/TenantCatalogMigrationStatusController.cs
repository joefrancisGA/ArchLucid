using ArchLucid.Api.Models.Tenancy;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Tenancy;

/// <summary>Tenant catalog migration maintenance status for operator banners (TB-2045).</summary>
[ApiController]
[Authorize]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/tenant")]
public sealed class TenantCatalogMigrationStatusController(
    ITenantMigrationStatusService tenantMigrationStatusService,
    ITenantRepository tenantRepository,
    IScopeContextProvider scopeProvider) : ControllerBase
{
    private readonly ITenantMigrationStatusService _tenantMigrationStatusService =
        tenantMigrationStatusService ?? throw new ArgumentNullException(nameof(tenantMigrationStatusService));

    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    [HttpGet("catalog-migration-status")]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [ProducesResponseType(typeof(TenantCatalogMigrationStatusResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCatalogMigrationStatusAsync(CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        if (tenant is null)
            return this.NotFoundProblem("Tenant not found.", ProblemTypes.ResourceNotFound);

        TenantMigrationStatusSnapshot snapshot =
            await _tenantMigrationStatusService.GetForTenantAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        return Ok(
            new TenantCatalogMigrationStatusResponse
            {
                InMigration = snapshot.InMigration,
                Message = snapshot.Message,
                CorrelationId = snapshot.CorrelationId,
                Stage = snapshot.Stage,
                MigrationId = snapshot.MigrationId,
                LastVerificationError = snapshot.LastVerificationError,
            });
    }
}
