using System.Text.Json;

using ArchLucid.Api.ProblemDetails;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Contracts.Alerts.Simulation;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Alerts;

public sealed partial class AlertSimulationController
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

        ScopeContext scope = _scopeProvider.GetCurrentScope();
        StampSimulationScope(scope, request);

        RuleSimulationResult result;

        try
        {
            result = await _simulationService.SimulateAsync(
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                request,
                ct);
        }
        catch (Exception ex) when (IsSealedManifestSimulationBlock(ex))
        {
            return MapSealedManifestSimulationBlockOrNull(ex)!;
        }
        catch (Exception ex) when (ex is ArgumentException or NullReferenceException or InvalidOperationException or FormatException or JsonException)
        {
            return this.BadRequestProblem(
                "Alert simulation request is invalid or incomplete.",
                ProblemTypes.ValidationFailed);
        }

        AuditEvent auditEvent = new()
        {
            EventType = AuditEventTypes.AlertRuleSimulationExecuted,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            DataJson = JsonSerializer.Serialize(new
            {
                request.RuleKind,
                result.EvaluatedRunCount,
                result.MatchedCount,
                result.WouldCreateCount,
                result.WouldSuppressCount
            })
        };

        string auditOperationLabel =
            $"{AuditEventTypes.AlertRuleSimulationExecuted}:tenant={scope.TenantId}:workspace={scope.WorkspaceId}:project={scope.ProjectId}";

        await DurableAuditLogRetry.TryLogAsync(
                ct => _auditService.LogAsync(auditEvent, ct),
                _logger,
                auditOperationLabel,
                ct,
                auditEventTypeForMetrics: AuditEventTypes.AlertRuleSimulationExecuted)
            .ConfigureAwait(false);

        return Ok(result);
    }
}
