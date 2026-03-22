using System.Text.Json;
using ArchiForge.Api.Auth.Models;
using ArchiForge.Core.Audit;
using ArchiForge.Core.Scoping;
using ArchiForge.Decisioning.Alerts;
using ArchiForge.Decisioning.Alerts.Composite;
using ArchiForge.Decisioning.Alerts.Tuning;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchiForge.Api.Controllers;

[ApiController]
[Authorize(Policy = ArchiForgePolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("api/alert-tuning")]
[EnableRateLimiting("fixed")]
public sealed class AlertTuningController : ControllerBase
{
    private readonly IScopeContextProvider _scopeProvider;
    private readonly IThresholdRecommendationService _thresholdRecommendationService;
    private readonly IAuditService _auditService;

    public AlertTuningController(
        IScopeContextProvider scopeProvider,
        IThresholdRecommendationService thresholdRecommendationService,
        IAuditService auditService)
    {
        _scopeProvider = scopeProvider;
        _thresholdRecommendationService = thresholdRecommendationService;
        _auditService = auditService;
    }

    [HttpPost("recommend-threshold")]
    [ProducesResponseType(typeof(ThresholdRecommendationResult), StatusCodes.Status200OK)]
    public async Task<ActionResult<ThresholdRecommendationResult>> RecommendThreshold(
        [FromBody] ThresholdRecommendationRequest request,
        CancellationToken ct = default)
    {
        var scope = _scopeProvider.GetCurrentScope();
        StampTuningScope(scope, request);

        var result = await _thresholdRecommendationService.RecommendAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            request,
            ct);

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.AlertThresholdRecommendationExecuted,
                DataJson = JsonSerializer.Serialize(new
                {
                    request.RuleKind,
                    request.TunedMetricType,
                    requestedCandidateCount = request.CandidateThresholds.Count,
                    evaluatedCandidateCount = result.Candidates.Count,
                    recommendedThreshold = result.RecommendedCandidate?.Candidate.ThresholdValue,
                }),
            },
            ct);

        return Ok(result);
    }

    private static void StampTuningScope(ScopeContext scope, ThresholdRecommendationRequest request)
    {
        if (request.BaseSimpleRule is not null)
        {
            request.BaseSimpleRule.TenantId = scope.TenantId;
            request.BaseSimpleRule.WorkspaceId = scope.WorkspaceId;
            request.BaseSimpleRule.ProjectId = scope.ProjectId;
        }

        if (request.BaseCompositeRule is not null)
        {
            request.BaseCompositeRule.TenantId = scope.TenantId;
            request.BaseCompositeRule.WorkspaceId = scope.WorkspaceId;
            request.BaseCompositeRule.ProjectId = scope.ProjectId;
        }
    }
}
