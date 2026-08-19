using System.Security.Claims;

using ArchLucid.Api.Models.Admin;
using ArchLucid.Api.Models.Tenancy;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Tenancy;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Admin;

/// <summary>Platform-scoped tenant lifecycle (scheduled erasure quarantine).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.PlatformTenantDeletionAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/admin/tenants")]
public sealed class AdminTenantsController(ITenantRepository tenantRepository, ITenantErasureCommandService tenantErasureCommands)
    : ControllerBase
{
    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    private readonly ITenantErasureCommandService _tenantErasureCommands =
        tenantErasureCommands ?? throw new ArgumentNullException(nameof(tenantErasureCommands));

    /// <summary>
    ///     Starts scheduled erasure quarantine (suspends tenant surface; hard purge runs after eligibility unless legal hold
    ///     blocks).
    /// </summary>
    [HttpPost("{id:guid}/delete")]
    [EnableRateLimiting("expensive")]
    [ProducesResponseType(typeof(TenantErasureOffboardAcceptedResponse), StatusCodes.Status202Accepted)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> StartTenantErasureOffboardAsync(Guid id, CancellationToken cancellationToken = default)
    {
        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(id, cancellationToken);

        if (tenant is null)
            return this.NotFoundProblem($"Tenant '{id:D}' was not found.", ProblemTypes.ResourceNotFound);

        ClaimsPrincipal user = User;
        string userId = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "unknown";
        string userName = user.Identity?.Name ?? "unknown";
        string? correlation = HttpContext.TraceIdentifier;

        TenantErasureOffboardResult? result =
            await _tenantErasureCommands.TryOffboardTenantAsync(id, userId, userName, correlation, cancellationToken);

        if (result is null)
            return this.ConflictProblem(
                "Tenant is already in erasure quarantine or could not be offboarded.",
                ProblemTypes.Conflict);

        return Accepted(
            new TenantErasureOffboardAcceptedResponse(id.ToString("D"), result.OffboardedUtc, result.ErasureEligibleUtc));
    }

    /// <summary>Clears erasure quarantine before eligible hard purge (break-glass).</summary>
    [HttpPost("{id:guid}/erasure/restore")]
    [EnableRateLimiting("expensive")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> RestoreTenantErasureQuarantineAsync(Guid id, CancellationToken cancellationToken = default)
    {
        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(id, cancellationToken);

        if (tenant is null)
            return this.NotFoundProblem($"Tenant '{id:D}' was not found.", ProblemTypes.ResourceNotFound);

        ClaimsPrincipal user = User;
        string userId = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "unknown";
        string userName = user.Identity?.Name ?? "unknown";
        string? correlation = HttpContext.TraceIdentifier;

        bool restored =
            await _tenantErasureCommands.TryRestoreQuarantineAsync(id, userId, userName, correlation, cancellationToken);

        if (!restored)
            return this.ConflictProblem("Tenant is not in erasure quarantine.", ProblemTypes.Conflict);

        return NoContent();
    }

    /// <summary>Sets or extends legal hold metadata (platform operator).</summary>
    [HttpPost("{id:guid}/erasure/legal-hold")]
    [EnableRateLimiting("expensive")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> SetTenantErasureLegalHoldPlatformAsync(
        Guid id,
        [FromBody] TenantErasureLegalHoldRequest body,
        CancellationToken cancellationToken = default)
    {
        if (body is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(id, cancellationToken);

        if (tenant is null)
            return this.NotFoundProblem($"Tenant '{id:D}' was not found.", ProblemTypes.ResourceNotFound);

        ClaimsPrincipal user = User;
        string userId = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "unknown";
        string userName = user.Identity?.Name ?? "unknown";
        string? correlation = HttpContext.TraceIdentifier;

        bool ok = await _tenantErasureCommands.TrySetLegalHoldAsync(
            id,
            body.UntilUtc,
            body.Reason,
            userId,
            userName,
            requireErasureQuarantine: false,
            correlation,
            cancellationToken);

        if (!ok)
            return this.ConflictProblem(
                "Legal hold could not be applied (untilUtc must be in the future).",
                ProblemTypes.Conflict);

        return NoContent();
    }

    /// <summary>Clears legal hold (platform operator only).</summary>
    [HttpDelete("{id:guid}/erasure/legal-hold")]
    [EnableRateLimiting("expensive")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> ClearTenantErasureLegalHoldAsync(Guid id, CancellationToken cancellationToken = default)
    {
        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(id, cancellationToken);

        if (tenant is null)
            return this.NotFoundProblem($"Tenant '{id:D}' was not found.", ProblemTypes.ResourceNotFound);

        ClaimsPrincipal user = User;
        string userId = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "unknown";
        string userName = user.Identity?.Name ?? "unknown";
        string? correlation = HttpContext.TraceIdentifier;

        bool cleared =
            await _tenantErasureCommands.TryClearLegalHoldAsync(id, userId, userName, correlation, cancellationToken);

        if (!cleared)
            return this.ConflictProblem("Tenant has no active legal hold.", ProblemTypes.Conflict);

        return NoContent();
    }
}
