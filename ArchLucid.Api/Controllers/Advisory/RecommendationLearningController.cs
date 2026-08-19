using System.Text.Json;

using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Contracts.Advisory.Learning;
using ArchLucid.Core.Persistence.Ports;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Advisory;

/// <summary>
///     Reads and rebuilds <see cref="RecommendationLearningProfile" /> aggregates for the caller’s scope
///     (acceptance/rejection patterns by category, urgency, etc.).
/// </summary>
/// <remarks>
///     Profiles feed composite alert metrics (acceptance rate via <c>AlertMetricSnapshotBuilder</c>) and advisory UX.
///     Rebuild scans recent recommendation rows via
///     <c>RecommendationLearningService</c>. Routes: <c>api/recommendation-learning</c>.
/// </remarks>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/recommendation-learning")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class RecommendationLearningController(
    IRecommendationLearningService learningService,
    IRecommendationLearningOperationalService operationalService,
    IScopeContextProvider scopeProvider,
    IAuditService auditService,
    IHostEnvironment hostEnvironment) : ControllerBase
{
    /// <summary>Returns the newest stored profile for the scope, or 404 if none exists.</summary>
    [HttpGet("latest")]
    [ProducesResponseType(typeof(RecommendationLearningProfile), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetLatest(CancellationToken ct = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();

        RecommendationLearningProfile? profile = await learningService.GetLatestProfileAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            ct);

        return profile is null
            ? this.NotFoundProblem("No recommendation learning profile found for the current scope.",
                ProblemTypes.ResourceNotFound)
            : Ok(profile);
    }

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

    /// <summary>Lists persisted profile versions for the current scope (newest first).</summary>
    [HttpGet("history")]
    [ProducesResponseType(typeof(IReadOnlyList<RecommendationLearningProfileHistoryItem>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<RecommendationLearningProfileHistoryItem>>> GetHistory(
        [FromQuery] int take = 20,
        CancellationToken ct = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();

        IReadOnlyList<RecommendationLearningProfileHistoryItem> history = await operationalService.ListHistoryAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            take,
            ct);

        return Ok(history);
    }

    /// <summary>Recomputes the recommendation learning profile from history, persists it, and records an audit event.</summary>
    /// <remarks>
    ///     Scans recent recommendation acceptance/rejection rows for the current scope via
    ///     <c>RebuildProfileAsync</c> and appends a new active profile row. An audit event of type
    ///     <c>RecommendationLearningProfileRebuilt</c> is written after a successful rebuild.
    ///     Requires <see cref="ArchLucidPolicies.ExecuteAuthority" />.
    /// </remarks>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>The newly rebuilt <see cref="RecommendationLearningProfile" />.</returns>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("rebuild")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(RecommendationLearningProfile), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Rebuild(CancellationToken ct = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();

        try
        {
            RecommendationLearningProfile profile = await learningService.RebuildProfileAsync(
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                ct);

            await auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.RecommendationLearningProfileRebuilt,
                    DataJson = JsonSerializer.Serialize(new { generatedUtc = profile.GeneratedUtc })
                },
                ct);

            return Ok(profile);
        }
        catch (InvalidOperationException ex)
        {
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }
    }

    /// <summary>Reactivates a prior persisted profile by appending a new row cloned from the selected version.</summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("rollback")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(RecommendationLearningProfile), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Rollback(
        [FromBody] RecommendationLearningRollbackRequest request,
        CancellationToken ct = default)
    {
        if (request.ProfileId == Guid.Empty)
        {
            return this.BadRequestProblem("profileId is required.", ProblemTypes.ValidationFailed);
        }

        if (string.IsNullOrWhiteSpace(request.Reason))
        {
            return this.BadRequestProblem("reason is required for rollback.", ProblemTypes.ValidationFailed);
        }

        ScopeContext scope = scopeProvider.GetCurrentScope();

        try
        {
            RecommendationLearningProfile profile = await operationalService.RollbackAsync(
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                request.ProfileId,
                ct);

            await auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.RecommendationLearningProfileRolledBack,
                    DataJson = JsonSerializer.Serialize(new
                    {
                        sourceProfileId = request.ProfileId,
                        reason = request.Reason.Trim(),
                        generatedUtc = profile.GeneratedUtc,
                        correlationId = HttpContext.TraceIdentifier,
                    }),
                },
                ct);

            return Ok(profile);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("not found", StringComparison.OrdinalIgnoreCase))
        {
            return this.NotFoundProblem(ex.Message, ProblemTypes.ResourceNotFound);
        }
        catch (InvalidOperationException ex)
        {
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }
    }
}
