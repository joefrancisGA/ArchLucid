using System.Text.Json;

using ArchLucid.Api.Attributes;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Governance;

/// <summary>Pre-finalize governance gate simulation against persisted findings plus optional synthetic injections.</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/governance/pre-finalize")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public sealed class GovernancePreCommitSimulationController(
    IPreCommitGovernanceGate gate,
    IPreFinalizeChecklistService preFinalizeChecklistService,
    IAuditService auditService,
    IRunRepository runRepository,
    IScopeContextProvider scopeContextProvider,
    ITenantRepository tenantRepository) : ControllerBase
{
    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    private async Task<IActionResult?> RequireTenantOrNotFoundAsync(CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        if (tenant is null)
            return this.NotFoundProblem("Tenant not found.", ProblemTypes.ResourceNotFound);

        return null;
    }
    // idempotency-posture: dry-run-no-persist
    [HttpGet("checklist/{runId}")]
    [ProducesResponseType(typeof(PreFinalizeChecklistResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetChecklistAsync(
        [FromRoute] string runId,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(runId))
            return this.BadRequestProblem("Run ID is required.", ProblemTypes.ValidationFailed);

        if (!TryParseRunId(runId.Trim(), out string runIdNormalized))
            return this.BadRequestProblem($"Run ID '{runId}' is not valid.", ProblemTypes.BadRequest);

        IActionResult? tenantProblem = await RequireTenantOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        Guid runGuid = Guid.Parse(runIdNormalized);
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        RunRecord? run = await _runRepository
            .GetByIdAsync(scope, runGuid, cancellationToken)
            .ConfigureAwait(false);

        if (run is null)
        {
            return this.NotFoundProblem(
                $"Run '{runIdNormalized}' was not found.",
                ProblemTypes.RunNotFound);
        }

        PreFinalizeChecklistResult checklist =
            await preFinalizeChecklistService.BuildAsync(runIdNormalized, cancellationToken);

        return Ok(checklist);
    }

    // idempotency-posture: dry-run-no-persist
    [HttpPost("simulate")]
    [ProducesResponseType(typeof(PreCommitGateResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SimulateAsync(
        [FromBody] PreCommitSyntheticSimulationRequest? body,
        CancellationToken cancellationToken = default)
    {
        if (body is null)

            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        if (string.IsNullOrWhiteSpace(body.RunId))
            return this.BadRequestProblem("Run ID is required.", ProblemTypes.ValidationFailed);

        if (!TryParseRunId(body.RunId.Trim(), out string runIdNormalized))
            return this.BadRequestProblem(
                $"Run ID '{body.RunId}' is not valid.",
                ProblemTypes.BadRequest);

        if (body.SyntheticCount < 0)
            return this.BadRequestProblem("syntheticCount must be non-negative.", ProblemTypes.ValidationFailed);

        IActionResult? tenantProblem = await RequireTenantOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        Guid runGuid = Guid.Parse(runIdNormalized);
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        RunRecord? run = await _runRepository
            .GetByIdAsync(scope, runGuid, cancellationToken)
            .ConfigureAwait(false);

        if (run is null)
        {
            return this.NotFoundProblem(
                $"Run '{runIdNormalized}' was not found.",
                ProblemTypes.RunNotFound);
        }

        PreCommitGateResult outcome = await gate.SimulateSyntheticFindingsAsync(
            runIdNormalized,
            body.SyntheticSeverity,
            body.SyntheticCount,
            cancellationToken);

        Guid? auditRunId = runGuid;

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.GovernancePreCommitSimulationEvaluated,
                RunId = auditRunId,
                DataJson = JsonSerializer.Serialize(new
                {
                    runId = runIdNormalized,
                    syntheticSeverity = body.SyntheticSeverity,
                    syntheticCount = body.SyntheticCount,
                    blocked = outcome.Blocked,
                    warnOnly = outcome.WarnOnly,
                    reason = outcome.Reason,
                    policyPackId = outcome.PolicyPackId,
                    minimumBlockingSeverity = outcome.MinimumBlockingSeverity,
                    blockingFindingIdCount = outcome.BlockingFindingIds.Count,
                    blockingFindingIdsSample = outcome.BlockingFindingIds.Take(10).ToArray(),
                    warningsCount = outcome.Warnings.Count
                })
            },
            cancellationToken);

        return Ok(outcome);
    }

    /// <remarks>
    ///     Accepts <c>guid</c> or compact <see cref="string" /> form used elsewhere in orchestration tooling.
    /// </remarks>
    private static bool TryParseRunId(string raw, out string normalizedId)
    {
        normalizedId = raw;

        return Guid.TryParse(raw, out _);
    }
}
