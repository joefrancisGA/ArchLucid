using ArchLucid.Api.Attributes;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Governance.PolicyPacks;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Decisioning.Governance.PolicyPacks;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Governance;

public sealed partial class GovernanceController
{
    [HttpPost("policy-pack/draft")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Draft endpoint is advisory-only and does not persist domain mutations.")]
    [ProducesResponseType(typeof(DraftPolicyPackRuleResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DraftPolicyPackRule(
        [FromBody] DraftPolicyPackInput? input,
        CancellationToken cancellationToken)
    {
        if (input is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        if (string.IsNullOrWhiteSpace(input.FreeTextIntent))
            return this.BadRequestProblem("FreeTextIntent is required.", ProblemTypes.ValidationFailed);

        if (input.FreeTextIntent.Trim().Length < 20)
            return this.BadRequestProblem("FreeTextIntent must be at least 20 characters.", ProblemTypes.ValidationFailed);

        IActionResult? tenantProblem = await RequireTenantAndWorkspaceOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        DraftPolicyPackRuleResponse response = await policyPackDraftService.DraftRuleAsync(input, cancellationToken);
        return Ok(response);
    }

    /// <summary>AI-assisted draft of a full curated rules document (advisory; not persisted).</summary>
    // idempotency-posture: dry-run-no-persist
    [HttpPost("policy-pack/generate")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Generate endpoint is advisory-only and does not persist domain mutations.")]
    [ProducesResponseType(typeof(GeneratePolicyPackResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> GeneratePolicyPack(
        [FromBody] GeneratePolicyPackRequest? input,
        CancellationToken cancellationToken)
    {
        if (input is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        if (string.IsNullOrWhiteSpace(input.Prompt))
            return this.BadRequestProblem("Prompt is required.", ProblemTypes.ValidationFailed);

        if (input.Prompt.Trim().Length < 20)
            return this.BadRequestProblem("Prompt must be at least 20 characters.", ProblemTypes.ValidationFailed);

        IActionResult? tenantProblem = await RequireTenantAndWorkspaceOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        try
        {
            GeneratePolicyPackResponse response = await policyPackGeneratorService.GenerateAsync(input, cancellationToken);
            return Ok(response);
        }
        catch (CuratedRulesDocumentValidationException ex)
        {
            string detail = ex.Errors.Count > 0 ? string.Join("; ", ex.Errors) : ex.Message;

            return this.UnprocessableEntityProblem(detail, ProblemTypes.ValidationFailed);
        }
    }
}
