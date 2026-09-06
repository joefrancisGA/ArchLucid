using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Application.Architecture;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Admin;

/// <summary>Platform admin one-shot architecture identity backfill (DA-12).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.AdminAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/admin/tenants")]
public sealed class AdminArchitectureIdentityBackfillController(
    IArchitectureIdentityBackfillService backfillService,
    ITenantRepository tenantRepository) : ControllerBase
{
    private readonly IArchitectureIdentityBackfillService _backfillService =
        backfillService ?? throw new ArgumentNullException(nameof(backfillService));

    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    [HttpPost("{tenantId:guid}/architecture-identity/backfill")]
    [ProducesResponseType(typeof(ArchitectureIdentityBackfillReport), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> BackfillScopeAsync(
        Guid tenantId,
        [FromBody] TenantCatalogMigrationScopeRequest request,
        CancellationToken cancellationToken)
    {
        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(tenantId, cancellationToken).ConfigureAwait(false);

        if (tenant is null)
            return NotFound();

        if (request.WorkspaceId == Guid.Empty || request.ProjectId == Guid.Empty)
            return BadRequest("WorkspaceId and ProjectId are required.");

        ScopeContext scope = new()
        {
            TenantId = tenantId,
            WorkspaceId = request.WorkspaceId,
            ProjectId = request.ProjectId,
        };

        ArchitectureIdentityBackfillReport report = await _backfillService
            .BackfillScopeAsync(scope, cancellationToken)
            .ConfigureAwait(false);

        return Ok(report);
    }
}
