using System.Text.Json;
using ArchiForge.Api.Auth.Models;
using ArchiForge.Core.Audit;
using ArchiForge.Core.Scoping;
using ArchiForge.Decisioning.Advisory.Learning;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchiForge.Api.Controllers;

[ApiController]
[Authorize(Policy = ArchiForgePolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("api/recommendation-learning")]
[EnableRateLimiting("fixed")]
public sealed class RecommendationLearningController(
    IRecommendationLearningService learningService,
    IScopeContextProvider scopeProvider,
    IAuditService auditService)
    : ControllerBase
{
    [HttpGet("latest")]
    [ProducesResponseType(typeof(RecommendationLearningProfile), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RecommendationLearningProfile>> GetLatest(CancellationToken ct = default)
    {
        var scope = scopeProvider.GetCurrentScope();

        var profile = await learningService.GetLatestProfileAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            ct);

        if (profile is null)
            return NotFound();

        return Ok(profile);
    }

    [HttpPost("rebuild")]
    [Authorize(Policy = ArchiForgePolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(RecommendationLearningProfile), StatusCodes.Status200OK)]
    public async Task<ActionResult<RecommendationLearningProfile>> Rebuild(CancellationToken ct = default)
    {
        var scope = scopeProvider.GetCurrentScope();

        var profile = await learningService.RebuildProfileAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            ct);

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.RecommendationLearningProfileRebuilt,
                DataJson = JsonSerializer.Serialize(new { generatedUtc = profile.GeneratedUtc }),
            },
            ct);

        return Ok(profile);
    }
}
