using System.Security.Claims;

using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Tenancy;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Admin;

/// <summary>Tenant registry provisioning and admin shut-off (admin-only).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.PlatformInternalOperationsAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/admin/tenants")]
public sealed class TenantsAdminController(
    ITenantRepository tenantRepository,
    ITenantProvisioningService provisioning,
    ITenantSuspendCommandService tenantSuspendCommands) : ControllerBase
{
    private readonly ITenantProvisioningService _provisioning =
        provisioning ?? throw new ArgumentNullException(nameof(provisioning));

    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    private readonly ITenantSuspendCommandService _tenantSuspendCommands =
        tenantSuspendCommands ?? throw new ArgumentNullException(nameof(tenantSuspendCommands));

    /// <summary>Lists registered tenants (global admin metadata; not RLS-scoped).</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<TenantRecord>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListAsync(CancellationToken cancellationToken = default)
    {
        IReadOnlyList<TenantRecord> rows = await _tenantRepository.ListAsync(cancellationToken);

        return Ok(rows);
    }

    /// <summary>Creates a tenant + default workspace identifiers (idempotent by derived slug).</summary>
    [HttpPost]
    [ProducesResponseType(typeof(TenantProvisioningResult), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ProvisionAsync(
        [FromBody] TenantProvisionAdminRequest? body,
        CancellationToken cancellationToken = default)
    {
        if (body is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        try
        {
            TenantProvisioningResult result = await _provisioning.ProvisionAsync(
                new TenantProvisioningRequest
                {
                    Name = body.Name, AdminEmail = body.AdminEmail, Tier = body.Tier, DataRegion = body.DataRegion,
                },
                cancellationToken);

            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
        catch (InvalidOperationException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
    }

    /// <summary>
    ///     Suspends the tenant surface (<c>SuspendedUtc</c>) without starting erasure quarantine.
    ///     Idempotent when already suspended.
    /// </summary>
    [HttpPost("{id:guid}/suspend")]
    [EnableRateLimiting("expensive")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> SuspendAsync(Guid id, CancellationToken cancellationToken = default)
    {
        TenantSuspendOutcome outcome = await _tenantSuspendCommands.TrySuspendAsync(
            id,
            ResolveActorUserId(),
            ResolveActorUserName(),
            HttpContext.TraceIdentifier,
            cancellationToken);

        return MapSuspendOutcome(id, outcome, shuttingOff: true);
    }

    /// <summary>
    ///     Clears admin suspend when the tenant is not in erasure quarantine.
    ///     Idempotent when already active.
    /// </summary>
    [HttpPost("{id:guid}/unsuspend")]
    [EnableRateLimiting("expensive")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> UnsuspendAsync(Guid id, CancellationToken cancellationToken = default)
    {
        TenantSuspendOutcome outcome = await _tenantSuspendCommands.TryUnsuspendAsync(
            id,
            ResolveActorUserId(),
            ResolveActorUserName(),
            HttpContext.TraceIdentifier,
            cancellationToken);

        return MapSuspendOutcome(id, outcome, shuttingOff: false);
    }

    private IActionResult MapSuspendOutcome(Guid id, TenantSuspendOutcome outcome, bool shuttingOff)
    {
        switch (outcome)
        {
            case TenantSuspendOutcome.NotFound:
                return this.NotFoundProblem($"Tenant '{id:D}' was not found.", ProblemTypes.ResourceNotFound);
            case TenantSuspendOutcome.InErasureQuarantine:
                return this.ConflictProblem(
                    shuttingOff
                        ? "Tenant is already in erasure quarantine; use platform erasure restore instead of suspend."
                        : "Tenant is in erasure quarantine; use platform erasure restore instead of unsuspend.",
                    ProblemTypes.Conflict);
            case TenantSuspendOutcome.AlreadyInDesiredState:
            case TenantSuspendOutcome.Applied:
                return NoContent();
            default:
                throw new InvalidOperationException($"Unexpected tenant suspend outcome '{outcome}'.");
        }
    }

    private string ResolveActorUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "unknown";

    private string ResolveActorUserName() =>
        User.Identity?.Name ?? "unknown";
}
