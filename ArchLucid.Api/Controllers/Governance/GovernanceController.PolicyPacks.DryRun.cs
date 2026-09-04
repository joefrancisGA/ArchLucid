using ArchLucid.Api.Http.Governance;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Governance.PolicyPacks;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Authorization;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Governance;

public sealed partial class GovernanceController
{
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

        if (!string.IsNullOrWhiteSpace(request.TargetRunId))
        {
            IActionResult? targetRunIdValidation =
                GovernanceApprovalRequestsHttpMapper.ValidateGovernanceRunId(request.TargetRunId)
                    .ToBadRequestProblemOrNull(this);

            if (targetRunIdValidation is not null)
                return targetRunIdValidation;

            if (!Guid.TryParse(request.TargetRunId.Trim(), out Guid targetRunGuid) || targetRunGuid == Guid.Empty)
            {
                return this.BadRequestProblem("targetRunId is not valid.", ProblemTypes.ValidationFailed);
            }
        }

        if (request.TargetManifestId == Guid.Empty)
        {
            return this.BadRequestProblem("targetManifestId is not valid.", ProblemTypes.ValidationFailed);
        }

        IActionResult? validationProblem =
            PolicyPackGovernanceDryRunHttpMapper.Validate(request).ToBadRequestProblemOrNull(this);

        if (validationProblem is not null)
            return validationProblem;

        IActionResult? tenantProblem = await RequireTenantAndWorkspaceOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

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

        // Snapshot so later Count/foreach use a stable non-null local (property getters do not flow).
        List<string>? evaluateAgainstRunIds = request.EvaluateAgainstRunIds;

        if (evaluateAgainstRunIds is null || evaluateAgainstRunIds.Count == 0)
            return this.BadRequestProblem(
                "evaluateAgainstRunIds must contain at least one run id.",
                ProblemTypes.ValidationFailed);

        if (!evaluateAgainstRunIds.Any(static id => !string.IsNullOrWhiteSpace(id)))
        {
            return this.BadRequestProblem(
                "evaluateAgainstRunIds must contain at least one non-empty run id.",
                ProblemTypes.ValidationFailed);
        }

        if (evaluateAgainstRunIds.Count > 50)
        {
            return this.BadRequestProblem(
                "At most 50 run ids are allowed per request.",
                ProblemTypes.ValidationFailed);
        }

        foreach (string runId in evaluateAgainstRunIds)
        {
            if (string.IsNullOrWhiteSpace(runId))
                continue;

            IActionResult? runIdValidation =
                GovernanceApprovalRequestsHttpMapper.ValidateGovernanceRunId(runId)
                    .ToBadRequestProblemOrNull(this);

            if (runIdValidation is not null)
                return runIdValidation;

            if (!Guid.TryParse(runId.Trim(), out Guid runGuid) || runGuid == Guid.Empty)
            {
                return this.BadRequestProblem(
                    "evaluateAgainstRunIds contains an invalid run id.",
                    ProblemTypes.ValidationFailed);
            }
        }

        if (id == Guid.Empty)
            return this.BadRequestProblem("id is required.", ProblemTypes.ValidationFailed);

        Dictionary<string, string>? proposedThresholds = request.ProposedThresholds;

        if (proposedThresholds is null)
        {
            return this.BadRequestProblem(
                "proposedThresholds is required.",
                ProblemTypes.ValidationFailed);
        }

        IActionResult? tenantProblem = await RequireTenantAndWorkspaceOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        PolicyPackDryRunResponse result = await _policyPackDryRunService.EvaluateAsync(
            id,
            proposedThresholds,
            evaluateAgainstRunIds,
            pageSize,
            page,
            cancellationToken);

        return Ok(result);
    }
}
