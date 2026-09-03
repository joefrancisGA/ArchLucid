using System.Text.Json;

using ArchLucid.Api.ProblemDetails;
using ArchLucid.Contracts.Advisory.Learning;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Advisory;

public sealed partial class RecommendationLearningController
{
    /// <summary>Internal operator view of profile lifecycle, eligibility, and scope metadata.</summary>
    [HttpGet("status")]
    [ProducesResponseType(typeof(RecommendationLearningOperationalStatusResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<RecommendationLearningOperationalStatusResponse>> GetStatus(CancellationToken ct = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();

        RecommendationLearningOperationalStatusResponse status = await operationalService.GetOperationalStatusAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            hostEnvironment.EnvironmentName,
            ct);

        return Ok(status);
    }

    /// <summary>Internal operator page bundle: status, latest profile (nullable), and version history.</summary>
    [HttpGet("ops-page")]
    [ProducesResponseType(typeof(RecommendationLearningOpsPageResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<RecommendationLearningOpsPageResponse>> GetOpsPage(
        [FromQuery] int take = 20,
        CancellationToken ct = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();

        Task<RecommendationLearningOperationalStatusResponse> statusTask =
            operationalService.GetOperationalStatusAsync(
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                hostEnvironment.EnvironmentName,
                ct);

        Task<RecommendationLearningProfile?> profileTask = learningService.GetLatestProfileAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            ct);

        Task<IReadOnlyList<RecommendationLearningProfileHistoryItem>> historyTask =
            operationalService.ListHistoryAsync(
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                take,
                ct);

        await Task.WhenAll(statusTask, profileTask, historyTask).ConfigureAwait(false);

        return Ok(new RecommendationLearningOpsPageResponse
        {
            Status = await statusTask.ConfigureAwait(false),
            LatestProfile = await profileTask.ConfigureAwait(false),
            History = await historyTask.ConfigureAwait(false)
        });
    }

    /// <summary>Recomputes a candidate profile without persisting or activating it.</summary>
    // idempotency-posture: dry-run-no-persist
    [HttpPost("preview")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(RecommendationLearningPreviewResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Preview(CancellationToken ct = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();

        try
        {
            RecommendationLearningPreviewResponse preview = await operationalService.PreviewRebuildAsync(
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                HttpContext.TraceIdentifier,
                ct);

            await auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.RecommendationLearningPreviewRequested,
                    DataJson = JsonSerializer.Serialize(new
                    {
                        correlationId = preview.CorrelationId,
                        eligibleRecordCount = preview.EligibleRecordCount,
                    }),
                },
                ct);

            return Ok(preview);
        }
        catch (InvalidOperationException ex)
        {
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }
    }
}
