using System.Text.Json;

using ArchLucid.Api.Attributes;
using ArchLucid.Api.Http;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Common;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Http;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Data.Repositories;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.AspNetCore.RateLimiting;


namespace ArchLucid.Api.Controllers.Governance;

public sealed partial class GovernanceController
{
    [HttpGet("schema-keys")]
    [OutputCache(PolicyName = "ImmutableShort")]
    [ProducesResponseType(typeof(PolicyPackSchemaKeysResponse), StatusCodes.Status200OK)]
    public IActionResult GetPolicyPackSchemaKeys()
    {
        PolicyPackSchemaKeysResponse response = _policyPackSchemaKeysService.GetSchemaKeys();
        return Ok(response);
    }

    /// <summary>
    ///     Returns the registered <c>PolicyPackContentDocument</c> JSON Schema for real-time policy pack editor validation.
    /// </summary>
    [HttpGet("policy-pack-content-schema")]
    [OutputCache(PolicyName = "ImmutableShort")]
    [ProducesResponseType(typeof(PolicyPackContentDocumentJsonSchemaResponse), StatusCodes.Status200OK)]
    public IActionResult GetPolicyPackContentDocumentJsonSchema()
    {
        PolicyPackContentDocumentJsonSchemaResponse response =
            _policyPackSchemaKeysService.GetContentDocumentJsonSchema();

        return Ok(response);
    }
    /// <summary>
    ///     Simulates proposed pack content against a single run's findings (pre-commit gate semantics) without persisting a pack.
    /// </summary>
    // idempotency-posture: dry-run-no-persist
    [HttpPost("simulate")]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [EnableRateLimiting("governancePolicyPackDryRun")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(PolicyPackGovernanceDryRunResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Simulate(
        [FromBody] PolicyPackSimulateRequest? request,
        CancellationToken cancellationToken)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        if (string.IsNullOrWhiteSpace(request.RunId))
        {
            return this.BadRequestProblem("runId is required.", ProblemTypes.ValidationFailed);
        }

        if (request.Content is null)
        {
            return this.BadRequestProblem("content is required.", ProblemTypes.ValidationFailed);
        }

        IActionResult? tenantProblem = await RequireTenantOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        string policyPackContentJson =
            JsonSerializer.Serialize(request.Content, ContractJson.CamelCaseIgnoreNullCompact);

        PolicyPackGovernanceDryRunResult? result = await _policyPackGovernanceDryRunService.EvaluateAsync(
            policyPackContentJson,
            request.RunId.Trim(),
            targetManifestId: null,
            request.BlockCommitOnCritical,
            request.BlockCommitMinimumSeverity,
            request.ProposedPolicyPackId,
            cancellationToken);

        if (result is null)
            return this.NotFoundProblem(
                "The target run was not found in the current tenant/workspace/project scope.",
                ProblemTypes.ResourceNotFound);

        return Ok(result);
    }

    /// <summary>
    ///     Dry-runs proposed <c>PolicyPackContentDocument</c> JSON against a single scoped run or golden manifest using
    ///     the same pre-commit severity evaluation as <see cref="IPreCommitGovernanceGate" />. Read-only: does not persist
    ///     the pack or change run state. Persists a redacted <c>GovernanceDryRunRequested</c> audit row via
    ///     <see cref="IPolicyPackGovernanceDryRunService" /> (same event family as
    ///     <see cref="DryRunPolicyPack" />). Uses <c>governancePolicyPackDryRun</c> rate limiting.
    /// </summary>
    // idempotency-posture: explicit-idempotency-key
    [HttpPost("policy-packs/dry-run")]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [EnableRateLimiting("governancePolicyPackDryRun")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(PolicyPackGovernanceDryRunResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DryRunProposedPolicyPack(
        [FromBody] PolicyPackGovernanceDryRunRequest? request,
        CancellationToken cancellationToken)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        IActionResult? tenantProblem = await RequireTenantOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        PolicyPackGovernanceDryRunResult? result = await _policyPackGovernanceDryRunService.EvaluateAsync(
            request.PolicyPackContentJson,
            string.IsNullOrWhiteSpace(request.TargetRunId) ? null : request.TargetRunId.Trim(),
            request.TargetManifestId,
            request.BlockCommitOnCritical,
            request.BlockCommitMinimumSeverity,
            request.ProposedPolicyPackId,
            cancellationToken);

        if (result is null)
            return this.NotFoundProblem(
                "The target run or manifest was not found in the current tenant/workspace/project scope.",
                ProblemTypes.ResourceNotFound);

        return Ok(result);
    }

    /// <summary>
    ///     Governance dry-run / what-if: evaluates a proposed set of policy thresholds against a fixed
    ///     list of run ids and returns per-run "would have blocked" deltas without modifying any
    ///     governance state. Read-auth gated (no commit happens). Persists a redacted
    ///     <c>GovernanceDryRunRequested</c> audit row per PENDING_QUESTIONS Q37; default page size 20,
    ///     server-clamped to 100 per Q38. Uses the <c>governancePolicyPackDryRun</c> rate-limit partition (
    ///     per authenticated user, tighter than the controller default).
    /// </summary>
    // idempotency-posture: explicit-idempotency-key
    [HttpPost("policy-packs/{id:guid}/dry-run")]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [EnableRateLimiting("governancePolicyPackDryRun")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(PolicyPackDryRunResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DryRunPolicyPack(
        [FromRoute] Guid id,
        [FromBody] PolicyPackDryRunRequest? request,
        [FromQuery] int? pageSize,
        [FromQuery] int? page,
        CancellationToken cancellationToken)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        if (request.EvaluateAgainstRunIds.Count == 0)
            return this.BadRequestProblem(
                "evaluateAgainstRunIds must contain at least one run id.",
                ProblemTypes.ValidationFailed);

        if (!request.EvaluateAgainstRunIds.Any(static id => !string.IsNullOrWhiteSpace(id)))
        {
            return this.BadRequestProblem(
                "evaluateAgainstRunIds must contain at least one non-empty run id.",
                ProblemTypes.ValidationFailed);
        }

        if (request.EvaluateAgainstRunIds.Count > 50)
        {
            return this.BadRequestProblem(
                "At most 50 run ids are allowed per request.",
                ProblemTypes.ValidationFailed);
        }

        IActionResult? tenantProblem = await RequireTenantOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        IReadOnlyDictionary<string, string> proposedThresholds =
            request.ProposedThresholds;

        PolicyPackDryRunResponse result = await _policyPackDryRunService.EvaluateAsync(
            id,
            proposedThresholds,
            request.EvaluateAgainstRunIds,
            pageSize,
            page,
            cancellationToken);

        return Ok(result);
    }
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

        IActionResult? tenantProblem = await RequireTenantOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

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

        IActionResult? tenantProblem = await RequireTenantOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

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
