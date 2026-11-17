using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.InfraEvidence;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.OperationalSecurity;

[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/operational-security/investigation-effort-inputs")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class OperationalSecurityInvestigationEffortController(
    ISecureNowInvestigationEffortInputService investigationEffortInputService,
    IScopeContextProvider scopeProvider,
    IActorContext actorContext) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(SecureNowInvestigationEffortInputsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetLatest(CancellationToken cancellationToken = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();
        SecureNowInvestigationEffortInputsResponse? inputs =
            await investigationEffortInputService.TryGetLatestAsync(scope, cancellationToken);

        if (inputs is null)
        {
            return this.NotFoundProblem(
                "Investigation effort inputs were not found.",
                ProblemTypes.ResourceNotFound);
        }

        return Ok(inputs);
    }

    // idempotency-posture: operator-documented-safe-retry
    [HttpPut]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Audit: SecureNowInvestigationEffortInputService logs save via IAuditService.")]
    [ProducesResponseType(typeof(SecureNowInvestigationEffortInputsSaveResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Save(
        [FromBody] SecureNowInvestigationEffortInputsWriteRequest? request,
        CancellationToken cancellationToken = default)
    {
        if (request is null)
        {
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);
        }

        ScopeContext scope = scopeProvider.GetCurrentScope();
        SecureNowInvestigationEffortInputsSaveResult result = await investigationEffortInputService.SaveAsync(
            scope,
            request,
            actorContext.GetActorId(),
            cancellationToken);

        if (!result.Succeeded)
        {
            return this.BadRequestProblem(
                result.ErrorMessage ?? "Investigation effort input save failed.",
                ProblemTypes.ValidationFailed);
        }

        return Ok(result);
    }
}
