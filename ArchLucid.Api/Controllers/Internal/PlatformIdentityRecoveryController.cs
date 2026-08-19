using System.Text.Json;

using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Common;
using ArchLucid.Application.Audit;
using ArchLucid.Application.Identity;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Internal;

[ApiController]
[Authorize(Policy = ArchLucidPolicies.PlatformIdentityRecoveryAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/internal/identity/recovery")]
public sealed class PlatformIdentityRecoveryController(
    IPlatformAuthRecoveryService recoveryService,
    IActorContext actorContext) : ControllerBase
{
    private readonly IPlatformAuthRecoveryService _recoveryService =
        recoveryService ?? throw new ArgumentNullException(nameof(recoveryService));

    private readonly IActorContext _actorContext =
        actorContext ?? throw new ArgumentNullException(nameof(actorContext));

    [HttpPost("grants")]
    [MutatingAuditExcluded("PlatformAuthRecoveryService emits immutable grant audit records.")]
    [ProducesResponseType(typeof(PlatformAuthRecoveryGrantView), StatusCodes.Status200OK)]
    public async Task<IActionResult> GrantAsync(
        [FromBody] PlatformAuthRecoveryGrantRequestBody request,
        CancellationToken cancellationToken)
    {
        if (request is null)
        {
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);
        }

        string actorId = _actorContext.GetActorId();

        try
        {
            PlatformAuthRecoveryGrantView grant = await _recoveryService.GrantTemporaryRecoveryAccessAsync(
                new PlatformAuthRecoveryGrantRequest
                {
                    TenantId = request.TenantId,
                    NormalizedDomain = request.NormalizedDomain,
                    Reason = request.Reason,
                    EvidenceReference = request.EvidenceReference,
                    DurationHours = request.DurationHours
                },
                actorId,
                cancellationToken).ConfigureAwait(false);

            return Ok(grant);
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

    [HttpDelete("grants/{grantId:guid}")]
    [MutatingAuditExcluded("PlatformAuthRecoveryService emits immutable revoke audit records.")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> RevokeAsync(Guid grantId, CancellationToken cancellationToken)
    {
        string actorId = _actorContext.GetActorId();
        bool revoked = await _recoveryService.RevokeGrantAsync(grantId, actorId, cancellationToken).ConfigureAwait(false);

        if (!revoked)
        {
            return this.NotFoundProblem("Recovery grant was not found.", ProblemTypes.ResourceNotFound);
        }

        return NoContent();
    }

    [HttpGet("grants/{grantId:guid}")]
    [MutatingAuditExcluded("Read-only grant lookup.")]
    [ProducesResponseType(typeof(PlatformAuthRecoveryGrantView), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAsync(Guid grantId, CancellationToken cancellationToken)
    {
        PlatformAuthRecoveryGrantView? grant =
            await _recoveryService.GetGrantAsync(grantId, cancellationToken).ConfigureAwait(false);

        return grant is null
            ? this.NotFoundProblem("Recovery grant was not found.", ProblemTypes.ResourceNotFound)
            : Ok(grant);
    }
}

public sealed class PlatformAuthRecoveryGrantRequestBody
{
    public Guid TenantId
    {
        get;
        init;
    }

    public string NormalizedDomain
    {
        get;
        init;
    } = string.Empty;

    public string Reason
    {
        get;
        init;
    } = string.Empty;

    public string EvidenceReference
    {
        get;
        init;
    } = string.Empty;

    public int DurationHours
    {
        get;
        init;
    } = 4;
}
