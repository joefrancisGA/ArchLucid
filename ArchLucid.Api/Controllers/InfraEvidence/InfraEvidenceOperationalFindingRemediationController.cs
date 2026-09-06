using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Common;
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
[Route("v{version:apiVersion}/infra-evidence/operational-findings/{findingId:guid}")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class InfraEvidenceOperationalFindingRemediationController(
    IRemediationPatternMatcherService matcherService,
    IScopeContextProvider scopeProvider) : ControllerBase
{
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("match")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Remediation pattern matching evaluates structured finding metadata only.")]
    [ProducesResponseType(typeof(RemediationPatternMatchEvaluationResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MatchFinding(Guid findingId, CancellationToken cancellationToken = default)
    {
        if (findingId == Guid.Empty)
            return this.BadRequestProblem("FindingId is required.", ProblemTypes.ValidationFailed);

        ScopeContext scope = scopeProvider.GetCurrentScope();

        RemediationPatternMatchEvaluationResult result =
            await matcherService.MatchFindingAsync(scope, findingId, cancellationToken);

        if (!result.Succeeded)
        {
            if (result.ErrorMessage?.Contains("not found", StringComparison.OrdinalIgnoreCase) == true)
                return this.NotFoundProblem(result.ErrorMessage, ProblemTypes.ResourceNotFound);

            return this.BadRequestProblem(
                result.ErrorMessage ?? "Remediation pattern matching failed.",
                ProblemTypes.ValidationFailed);
        }

        return Ok(result);
    }
}
