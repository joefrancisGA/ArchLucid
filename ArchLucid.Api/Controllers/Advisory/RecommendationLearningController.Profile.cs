using ArchLucid.Api.ProblemDetails;
using ArchLucid.Contracts.Advisory.Learning;
using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Advisory;

public sealed partial class RecommendationLearningController
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
}
