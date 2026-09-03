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
