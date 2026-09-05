using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Common;
using ArchLucid.Application.InfraEvidence.RemediationPrioritization;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.OperationalSecurity;

[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/operational-security/remediation-prioritization")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class RemediationPrioritizationController(
    IRemediationPrioritizationService prioritizationService,
    IScopeContextProvider scopeProvider,
    IActorContext actorContext) : ControllerBase
{
    [HttpGet("ranked")]
    [ProducesResponseType(typeof(IReadOnlyList<RemediationPrioritizedFinding>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListRanked(CancellationToken cancellationToken = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();

        IReadOnlyList<RemediationPrioritizedFinding> ranked = await prioritizationService.RankOpenFindingsAsync(
            scope,
            actorContext.GetActorId(),
            cancellationToken);

        return Ok(ranked);
    }

    [HttpGet("findings/{findingId:guid}/score")]
    [ProducesResponseType(typeof(RemediationPrioritizationExplanation), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetScoreExplanation(
        Guid findingId,
        CancellationToken cancellationToken = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();

        RemediationPrioritizationExplanation? explanation = await prioritizationService.GetExplanationAsync(
            scope,
            findingId,
            cancellationToken);

        if (explanation is null)
            return NotFound();

        return Ok(explanation);
    }

    [HttpGet("weights")]
    [ProducesResponseType(typeof(IReadOnlyDictionary<string, decimal>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetWeights(CancellationToken cancellationToken = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();

        IReadOnlyDictionary<RemediationRiskFactor, decimal> weights =
            await prioritizationService.GetWeightsAsync(scope, cancellationToken);

        Dictionary<string, decimal> response = weights.ToDictionary(
            item => item.Key.ToString(),
            item => item.Value);

        return Ok(response);
    }

    [HttpPut("weights")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Remediation prioritization weights are tenant-scoped configuration.")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateWeights(
        [FromBody] Dictionary<string, decimal>? weights,
        CancellationToken cancellationToken = default)
    {
        if (weights is null || weights.Count == 0)
            return this.BadRequestProblem("Weights payload is required.", ProblemTypes.ValidationFailed);

        ScopeContext scope = scopeProvider.GetCurrentScope();
        Dictionary<RemediationRiskFactor, decimal> parsed = [];

        foreach (KeyValuePair<string, decimal> entry in weights)
        {
            if (!Enum.TryParse(entry.Key, ignoreCase: true, out RemediationRiskFactor factor))
            {
                return this.BadRequestProblem(
                    $"Unknown factor '{entry.Key}'.",
                    ProblemTypes.ValidationFailed);
            }

            parsed[factor] = entry.Value;
        }

        await prioritizationService.UpdateWeightsAsync(scope, parsed, actorContext.GetActorId(), cancellationToken);

        return NoContent();
    }

    [HttpGet("suggested-wave-sizes")]
    [ProducesResponseType(typeof(IReadOnlyList<int>), StatusCodes.Status200OK)]
    public IActionResult GetSuggestedWaveSizes() =>
        Ok(RemediationPrioritizationConstants.SuggestedWaveSizes);
}
