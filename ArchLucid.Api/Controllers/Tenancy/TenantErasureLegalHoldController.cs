using System.Security.Claims;

using ArchLucid.Api.Models.Tenancy;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Tenancy;

/// <summary>Tenant-admin legal hold during scheduled erasure quarantine.</summary>
[ApiController]
[Authorize]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/tenant/erasure")]
public sealed class TenantErasureLegalHoldController(
    ITenantErasureCommandService tenantErasureCommands,
    IScopeContextProvider scopeProvider) : ControllerBase
{
    private readonly ITenantErasureCommandService _tenantErasureCommands =
        tenantErasureCommands ?? throw new ArgumentNullException(nameof(tenantErasureCommands));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    /// <summary>Extend legal hold while the tenant is in erasure quarantine (tenant <c>Admin</c>).</summary>
    [HttpPost("legal-hold")]
    [Authorize(Policy = ArchLucidPolicies.AdminAuthority)]
    [EnableRateLimiting("expensive")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> SetLegalHoldAsync(
        [FromBody] TenantErasureLegalHoldRequest body,
        CancellationToken cancellationToken = default)
    {
        if (body is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        ScopeContext scope = _scopeProvider.GetCurrentScope();
        ClaimsPrincipal user = User;
        string userId = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "unknown";
        string userName = user.Identity?.Name ?? "unknown";
        string? correlation = HttpContext.TraceIdentifier;

        bool ok = await _tenantErasureCommands.TrySetLegalHoldAsync(
            scope.TenantId,
            body.UntilUtc,
            body.Reason,
            userId,
            userName,
            requireErasureQuarantine: true,
            correlation,
            cancellationToken);

        if (!ok)
            return this.ConflictProblem(
                "Legal hold could not be applied (tenant missing, not in erasure quarantine, or untilUtc is not in the future).",
                ProblemTypes.Conflict);

        return NoContent();
    }

    /// <summary>Approve tenant erasure (tenant <c>Admin</c>).</summary>
    [HttpPost("approve")]
    [Authorize(Policy = ArchLucidPolicies.AdminAuthority)]
    [EnableRateLimiting("expensive")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> ApproveErasureAsync(CancellationToken cancellationToken = default)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        ClaimsPrincipal user = User;
        string userId = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "unknown";
        string userName = user.Identity?.Name ?? "unknown";
        string? correlation = HttpContext.TraceIdentifier;

        bool ok = await _tenantErasureCommands.TryApproveErasureAsync(
            scope.TenantId,
            userId,
            userName,
            correlation,
            cancellationToken);

        if (!ok)
            return this.ConflictProblem(
                "Erasure could not be approved (tenant missing, not in erasure quarantine, or already approved).",
                ProblemTypes.Conflict);

        return NoContent();
    }
}
