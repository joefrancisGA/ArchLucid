using ArchLucid.Api.Attributes;
using ArchLucid.Api.Http.Tenancy;
using ArchLucid.Api.Models.Tenancy;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Tenancy;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Tenancy;

/// <summary>Self-service trial status for the tenant in <see cref="IScopeContextProvider" /> scope.</summary>
[ApiController]
[Authorize]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/tenant")]
public sealed class TenantTrialController(ITenantTrialFacade trialFacade) : ControllerBase
{
    private readonly ITenantTrialFacade _trialFacade =
        trialFacade ?? throw new ArgumentNullException(nameof(trialFacade));

    /// <summary>Returns trial window metadata when the tenant row was provisioned via self-service bootstrap.</summary>
    [HttpGet("trial-status")]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [ProducesResponseType(typeof(TenantTrialStatusResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTrialStatusAsync(CancellationToken cancellationToken)
    {
        TenantTrialStatusQueryResult result = await _trialFacade.GetTrialStatusAsync(cancellationToken)
            .ConfigureAwait(false);

        return result.Outcome switch
        {
            TenantTrialHttpOutcome.Success => Ok(TenantTrialHttpMapper.MapStatus(result.Status!)),
            TenantTrialHttpOutcome.TenantNotFound => this.NotFoundProblem("Tenant not found.", ProblemTypes.ResourceNotFound),
            _ => throw new InvalidOperationException($"Unexpected trial status outcome: {result.Outcome}."),
        };
    }

    /// <summary>
    ///     Binds corporate Entra directory id (<c>tid</c>) to this tenant after paid conversion. Optionally links a trial
    ///     local user when <see cref="TenantLinkEntraRequest.LocalEmail" /> and <see cref="TenantLinkEntraRequest.EntraOid" />
    ///     are both set.
    /// </summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("link-entra")]
    [SkipTrialWriteLimit]
    [Authorize(Policy = ArchLucidPolicies.AdminAuthority)]
    [MutatingAuditExcluded("Audit: ITenantTrialFacade.LinkEntraAsync logs TenantEntraDirectoryBound and TrialLocalIdentityLinkedToEntra.")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> LinkEntraAsync(
        [FromBody] TenantLinkEntraRequest? body,
        CancellationToken cancellationToken)
    {
        if (body is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        TenantTrialLinkEntraResult result = await _trialFacade.LinkEntraAsync(
                TenantTrialHttpMapper.MapLinkEntraBody(body),
                User.Identity?.Name ?? "admin",
                cancellationToken)
            .ConfigureAwait(false);

        return result.Outcome switch
        {
            TenantTrialHttpOutcome.Success => NoContent(),
            TenantTrialHttpOutcome.TenantNotFound => this.NotFoundProblem("Tenant not found.", ProblemTypes.ResourceNotFound),
            TenantTrialHttpOutcome.ValidationFailed => this.BadRequestProblem(
                result.Message ?? "Validation failed.",
                ProblemTypes.ValidationFailed),
            TenantTrialHttpOutcome.Conflict => this.ConflictProblem(
                result.Message ?? "Conflict.",
                ProblemTypes.Conflict),
            _ => throw new InvalidOperationException($"Unexpected link-entra outcome: {result.Outcome}."),
        };
    }

    /// <summary>Marks an active trial as converted after billing rules pass (paid row or Noop provider).</summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("convert")]
    [SkipTrialWriteLimit]
    [Authorize(Policy = ArchLucidPolicies.AdminAuthority)]
    [MutatingAuditExcluded("Audit: ITenantTrialFacade.ConvertTrialAsync logs TenantTrialConverted.")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ConvertTrialAsync(
        [FromBody] TenantTrialConvertRequest? body,
        CancellationToken cancellationToken)
    {
        TenantTrialConvertResult result = await _trialFacade.ConvertTrialAsync(
                TenantTrialHttpMapper.MapConvertBody(body),
                User.Identity?.Name ?? "admin",
                cancellationToken)
            .ConfigureAwait(false);

        return result.Outcome switch
        {
            TenantTrialHttpOutcome.Success => NoContent(),
            TenantTrialHttpOutcome.TenantNotFound => this.NotFoundProblem("Tenant not found.", ProblemTypes.ResourceNotFound),
            TenantTrialHttpOutcome.ValidationFailed => this.BadRequestProblem(
                result.Message ?? "Validation failed.",
                ProblemTypes.ValidationFailed),
            TenantTrialHttpOutcome.Conflict => this.ConflictProblem(
                result.Message ?? "Conflict.",
                ProblemTypes.Conflict),
            _ => throw new InvalidOperationException($"Unexpected convert outcome: {result.Outcome}."),
        };
    }
}
