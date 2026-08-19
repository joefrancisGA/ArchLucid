using System.Text.Json;

using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Contracts.Alerts;
using ArchLucid.Contracts.Alerts.Composite;
using ArchLucid.Contracts.Alerts.Simulation;
using ArchLucid.Core.Alerts.Simulation;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Alerts;

/// <summary>
///     HTTP API for alert rule what-if simulation and A/B comparison over the caller’s scope (read authority).
/// </summary>
/// <remarks>
///     Stamps tenant/workspace/project on embedded rule DTOs from <see cref="IScopeContextProvider" /> before invoking
///     <see cref="IRuleSimulationService" />.
/// </remarks>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/alert-simulation")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class AlertSimulationController(
    IScopeContextProvider scopeProvider,
    IRuleSimulationService simulationService,
    IAuditService auditService)
    : ControllerBase
{
    /// <summary>Runs <see cref="IRuleSimulationService.SimulateAsync" /> and audits aggregate counts.</summary>
    // idempotency-posture: dry-run-no-persist
    [HttpPost("simulate")]
    [ProducesResponseType(typeof(RuleSimulationResult), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Simulate(
        [FromBody] RuleSimulationRequest? request,
        CancellationToken ct = default)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        if (!TryResolveRuleKind(request.RuleKind, out bool isSimple, out IActionResult? ruleKindError))
            return ruleKindError!;

        if (isSimple && request.SimpleRule is null)
            return this.BadRequestProblem("SimpleRule is required when RuleKind is Simple.", ProblemTypes.ValidationFailed);

        if (!isSimple && request.CompositeRule is null)
            return this.BadRequestProblem(
                "CompositeRule is required when RuleKind is Composite.",
                ProblemTypes.ValidationFailed);

        ScopeContext scope = scopeProvider.GetCurrentScope();
        StampSimulationScope(scope, request);

        try
        {
            RuleSimulationResult result = await simulationService.SimulateAsync(
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                request,
                ct);

            await auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.AlertRuleSimulationExecuted,
                    DataJson = JsonSerializer.Serialize(new
                    {
                        request.RuleKind,
                        result.EvaluatedRunCount,
                        result.MatchedCount,
                        result.WouldCreateCount,
                        result.WouldSuppressCount
                    })
                },
                ct);

            return Ok(result);
        }
        catch (Exception ex) when (ex is ArgumentException or NullReferenceException or InvalidOperationException)
        {
            return this.BadRequestProblem(
                "Alert simulation request is invalid or incomplete.",
                ProblemTypes.ValidationFailed);
        }
    }

    /// <summary>
    ///     Runs <see cref="IRuleSimulationService.CompareCandidatesAsync" /> and audits would-create counts per
    ///     candidate.
    /// </summary>
    // idempotency-posture: dry-run-no-persist
    [HttpPost("compare-candidates")]
    [ProducesResponseType(typeof(RuleCandidateComparisonResult), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CompareCandidates(
        [FromBody] RuleCandidateComparisonRequest? request,
        CancellationToken ct = default)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        if (!TryResolveRuleKind(request.RuleKind, out bool isSimple, out IActionResult? ruleKindError))
            return ruleKindError!;

        if (isSimple &&
            (request.CandidateASimpleRule is null || request.CandidateBSimpleRule is null))
            return this.BadRequestProblem(
                "CandidateASimpleRule and CandidateBSimpleRule are required when RuleKind is Simple.",
                ProblemTypes.ValidationFailed);

        if (!isSimple &&
            (request.CandidateACompositeRule is null || request.CandidateBCompositeRule is null))
            return this.BadRequestProblem(
                "CandidateACompositeRule and CandidateBCompositeRule are required when RuleKind is Composite.",
                ProblemTypes.ValidationFailed);

        ScopeContext scope = scopeProvider.GetCurrentScope();
        StampComparisonScope(scope, request);

        try
        {
            RuleCandidateComparisonResult result = await simulationService.CompareCandidatesAsync(
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                request,
                ct);

            await auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.AlertRuleCandidateComparisonExecuted,
                    DataJson = JsonSerializer.Serialize(new
                    {
                        request.RuleKind,
                        candidateAWouldCreate = result.CandidateA.WouldCreateCount,
                        candidateBWouldCreate = result.CandidateB.WouldCreateCount
                    })
                },
                ct);

            return Ok(result);
        }
        catch (Exception ex) when (ex is ArgumentException or NullReferenceException or InvalidOperationException)
        {
            return this.BadRequestProblem(
                "Alert candidate comparison request is invalid or incomplete.",
                ProblemTypes.ValidationFailed);
        }
    }

    private bool TryResolveRuleKind(string? ruleKind, out bool isSimple, out IActionResult? error)
    {
        isSimple = false;
        error = null;

        if (string.IsNullOrWhiteSpace(ruleKind))
        {
            error = this.BadRequestProblem("RuleKind is required (Simple or Composite).", ProblemTypes.ValidationFailed);
            return false;
        }

        if (ruleKind.Equals("Simple", StringComparison.OrdinalIgnoreCase))
        {
            isSimple = true;
            return true;
        }

        if (ruleKind.Equals("Composite", StringComparison.OrdinalIgnoreCase))
            return true;

        error = this.BadRequestProblem(
            "RuleKind must be Simple or Composite.",
            ProblemTypes.ValidationFailed);
        return false;
    }

    private static void StampSimulationScope(ScopeContext scope, RuleSimulationRequest request)
    {
        if (request.SimpleRule is not null)
        {
            request.SimpleRule.TenantId = scope.TenantId;
            request.SimpleRule.WorkspaceId = scope.WorkspaceId;
            request.SimpleRule.ProjectId = scope.ProjectId;
        }

        if (request.CompositeRule is null)
            return;

        request.CompositeRule.TenantId = scope.TenantId;
        request.CompositeRule.WorkspaceId = scope.WorkspaceId;
        request.CompositeRule.ProjectId = scope.ProjectId;
    }

    private static void StampComparisonScope(ScopeContext scope, RuleCandidateComparisonRequest request)
    {
        StampSimple(request.CandidateASimpleRule);
        StampSimple(request.CandidateBSimpleRule);
        StampComposite(request.CandidateACompositeRule);
        StampComposite(request.CandidateBCompositeRule);
        return;

        void StampSimple(AlertRule? r)
        {
            if (r is null)
                return;
            r.TenantId = scope.TenantId;
            r.WorkspaceId = scope.WorkspaceId;
            r.ProjectId = scope.ProjectId;
        }

        void StampComposite(CompositeAlertRule? r)
        {
            if (r is null)
                return;
            r.TenantId = scope.TenantId;
            r.WorkspaceId = scope.WorkspaceId;
            r.ProjectId = scope.ProjectId;
        }
    }
}
