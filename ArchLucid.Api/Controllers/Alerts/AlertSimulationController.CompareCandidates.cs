using System.Text.Json;

using ArchLucid.Api.ProblemDetails;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Contracts.Alerts.Simulation;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Alerts;

public sealed partial class AlertSimulationController
{
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

        ScopeContext scope = _scopeProvider.GetCurrentScope();
        StampComparisonScope(scope, request);

        try
        {
            RuleCandidateComparisonResult result = await _simulationService.CompareCandidatesAsync(
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                request,
                ct);

            await _auditService.LogAsync(
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
        catch (Exception ex) when (IsSealedManifestSimulationBlock(ex))
        {
            return MapSealedManifestSimulationBlockOrNull(ex)!;
        }
        catch (Exception ex) when (ex is ArgumentException or NullReferenceException or InvalidOperationException or FormatException or JsonException)
        {
            return this.BadRequestProblem(
                "Alert candidate comparison request is invalid or incomplete.",
                ProblemTypes.ValidationFailed);
        }
    }
}
