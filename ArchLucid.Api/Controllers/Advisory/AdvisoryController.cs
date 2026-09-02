using System.Security.Claims;
using System.Text.Json;

using ArchLucid.Api.Attributes;
using ArchLucid.Api.Contracts;
using ArchLucid.Api.Mapping;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Support;
using ArchLucid.Application.Advisory;
using ArchLucid.Contracts.Advisory.Models;
using ArchLucid.Contracts.Advisory.Workflow;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Decisioning.Models;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Api.Controllers.Advisory;

[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/advisory")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class AdvisoryController(
    IAdvisoryWorkflowFacade advisoryWorkflowFacade,
    IScopeContextProvider scopeProvider,
    IAuditService auditService,
    ILogger<AdvisoryController> logger) : ControllerBase
{
    private readonly IAdvisoryWorkflowFacade _advisoryWorkflowFacade =
        advisoryWorkflowFacade ?? throw new ArgumentNullException(nameof(advisoryWorkflowFacade));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly ILogger<AdvisoryController> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    [HttpGet("runs/{runId:guid}/improvements")]
    [ProducesResponseType(typeof(ImprovementPlanResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetImprovements(
        Guid runId,
        [FromQuery] Guid? compareToRunId = null,
        CancellationToken ct = default)
    {
        ImprovementsPlanLoadResult result =
            await _advisoryWorkflowFacade.GetImprovementsAsync(runId, compareToRunId, ct);

        return result.Outcome switch
        {
            ImprovementsPlanLoadOutcome.Success when result.Plan is not null => await CompleteImprovementsAsync(result, ct),
            ImprovementsPlanLoadOutcome.RunNotFound => this.NotFoundProblem($"Run '{result.RunId}' was not found.", ProblemTypes.RunNotFound),
            ImprovementsPlanLoadOutcome.ManifestNotFound => this.NotFoundProblem($"Run '{result.RunId}' does not have a committed golden manifest.", ProblemTypes.ManifestNotFound),
            ImprovementsPlanLoadOutcome.ComparisonRunNotFound => this.NotFoundProblem($"Comparison run '{result.RunId}' was not found.", ProblemTypes.RunNotFound),
            ImprovementsPlanLoadOutcome.ComparisonManifestNotFound => this.NotFoundProblem($"Comparison run '{result.RunId}' does not have a committed golden manifest.", ProblemTypes.ManifestNotFound),
            _ => throw new InvalidOperationException($"Unexpected improvements load outcome: {result.Outcome}."),
        };
    }

    [HttpGet("runs/{runId:guid}/recommendations")]
    [ProducesResponseType(typeof(AdvisoryRunRecommendationsListResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<AdvisoryRunRecommendationsListResponse>> ListRecommendations(Guid runId, CancellationToken ct = default)
    {
        AdvisoryRecommendationsListResult result = await _advisoryWorkflowFacade.ListRecommendationsAsync(runId, ct);
        return Ok(new AdvisoryRunRecommendationsListResponse
        {
            Recommendations = result.Recommendations.Select(ToRecordResponse).ToList(),
            ImproveLoopEvidence = RecommendationImproveLoopResponseMapper.TryParsePersistedEvidence(result.ImproveLoopEvidenceJson),
        });
    }

    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("recommendations/{recommendationId:guid}/action")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(RecommendationActionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ApplyRecommendationAction(
        Guid recommendationId,
        [FromBody] RecommendationActionRequest? request,
        CancellationToken ct = default)
    {
        if (request is null) return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);
        if (!IsKnownRecommendationAction(request.Action)) return this.BadRequestProblem("Unknown or missing action.", ProblemTypes.ValidationFailed);

        string userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "unknown";
        string userName = User.Identity?.Name ?? "unknown";
        ApplyRecommendationActionFacadeResult result = await _advisoryWorkflowFacade.ApplyRecommendationActionAsync(recommendationId, userId, userName, request, ct);

        if (result.Outcome is ApplyRecommendationActionOutcome.NotFound)
            return this.NotFoundProblem($"Recommendation '{result.RecommendationId}' was not found.", ProblemTypes.ResourceNotFound);

        RecommendationRecord updated = result.Updated ?? throw new InvalidOperationException();
        string eventType = request.Action switch
        {
            RecommendationActionType.Accept => AuditEventTypes.RecommendationAccepted,
            RecommendationActionType.Reject => AuditEventTypes.RecommendationRejected,
            RecommendationActionType.Defer => AuditEventTypes.RecommendationDeferred,
            RecommendationActionType.MarkImplemented => AuditEventTypes.RecommendationImplemented,
            _ => "RecommendationAction",
        };

        await _auditService.LogAsync(new AuditEvent { EventType = eventType, RunId = updated.RunId, DataJson = JsonSerializer.Serialize(new { recommendationId, action = request.Action }) }, ct);
        return Ok(new RecommendationActionResponse { Recommendation = ToRecordResponse(updated), ImproveLoop = RecommendationImproveLoopResponseMapper.ToEvidenceResponse(result.ImproveLoop) });
    }

    private async Task<IActionResult> CompleteImprovementsAsync(ImprovementsPlanLoadResult result, CancellationToken ct)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        FindingsListAccessTelemetry.LogFindingSnapshotExpose(_logger, scope, result.Plan!.RunId, nameof(GetImprovements), result.AdvisoryFindingCount);
        await _advisoryWorkflowFacade.PersistImprovementPlanAsync(result, ct);
        await _auditService.LogAsync(new AuditEvent { EventType = AuditEventTypes.RecommendationGenerated, RunId = result.Plan.RunId, DataJson = JsonSerializer.Serialize(new { recommendationCount = result.Plan.Recommendations.Count }) }, ct);
        return Ok(ToResponse(result.Plan));
    }

    private static bool IsKnownRecommendationAction(string? action) =>
        action is RecommendationActionType.Accept or RecommendationActionType.Reject or RecommendationActionType.Defer or RecommendationActionType.MarkImplemented;

    private static ImprovementPlanResponse ToResponse(ImprovementPlan plan) => new()
    {
        RunId = plan.RunId, ComparedToRunId = plan.ComparedToRunId, GeneratedUtc = plan.GeneratedUtc, SummaryNotes = plan.SummaryNotes.ToList(),
        Recommendations = plan.Recommendations.Select(x => new ImprovementRecommendationResponse { RecommendationId = x.RecommendationId, Title = x.Title, Category = x.Category, Rationale = x.Rationale, SuggestedAction = x.SuggestedAction, Urgency = x.Urgency, ExpectedImpact = x.ExpectedImpact, PriorityScore = x.PriorityScore }).ToList(),
    };

    private static RecommendationRecordResponse ToRecordResponse(RecommendationRecord r) => new()
    {
        RecommendationId = r.RecommendationId, TenantId = r.TenantId, WorkspaceId = r.WorkspaceId, ProjectId = r.ProjectId, RunId = r.RunId, ComparedToRunId = r.ComparedToRunId,
        Title = r.Title, Category = r.Category, Rationale = r.Rationale, SuggestedAction = r.SuggestedAction, Urgency = r.Urgency, ExpectedImpact = r.ExpectedImpact, PriorityScore = r.PriorityScore,
        Status = r.Status, CreatedUtc = r.CreatedUtc, LastUpdatedUtc = r.LastUpdatedUtc, ReviewedByUserId = r.ReviewedByUserId, ReviewedByUserName = r.ReviewedByUserName,
        ReviewComment = r.ReviewComment, ResolutionRationale = r.ResolutionRationale, SourceEvidenceLinks = RecommendationSourceEvidenceLinksBuilder.Build(r).ToList(),
    };
}
