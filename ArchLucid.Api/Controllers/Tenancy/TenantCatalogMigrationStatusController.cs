using ArchLucid.Api.Models.Tenancy;
using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;

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
    IScopeContextProvider scopeProvider) : ControllerBase
{
    private readonly ITenantMigrationStatusService _tenantMigrationStatusService =
        tenantMigrationStatusService ?? throw new ArgumentNullException(nameof(tenantMigrationStatusService));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    [HttpGet("catalog-migration-status")]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [ProducesResponseType(typeof(TenantCatalogMigrationStatusResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCatalogMigrationStatusAsync(CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
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
