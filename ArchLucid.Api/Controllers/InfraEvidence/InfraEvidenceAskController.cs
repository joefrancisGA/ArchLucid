using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
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

namespace ArchLucid.Api.Controllers.InfraEvidence;

[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/infra-evidence/ask")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class InfraEvidenceAskController(
    IInfraEvidenceAskGroundingService askGroundingService,
    IScopeContextProvider scopeProvider) : ControllerBase
{
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost]
    [MutatingAuditExcluded("Infra-evidence Ask grounding is read-only over structured evidence rows.")]
    [ProducesResponseType(typeof(InfraEvidenceAskResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Ask(
        [FromBody] InfraEvidenceAskRequest? request,
        CancellationToken cancellationToken = default)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        if (string.IsNullOrWhiteSpace(request.Question))
            return this.BadRequestProblem("Question is required.", ProblemTypes.ValidationFailed);

        ScopeContext scope = scopeProvider.GetCurrentScope();

        try
        {
            InfraEvidenceAskGroundingResult result = await askGroundingService.TryAnswerAsync(
                scope,
                request,
                cancellationToken);

            if (!result.Succeeded || result.Response is null)
            {
                return this.BadRequestProblem(
                    result.ErrorMessage ?? "Infra-evidence Ask grounding failed.",
                    ProblemTypes.ValidationFailed);
            }

            return Ok(result.Response);
        }
        catch (ConflictException ex)
        {
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }
    }
}
