using ArchiForge.Api.Auth.Models;
using ArchiForge.Api.ProductLearning;
using ArchiForge.Api.ProblemDetails;
using ArchiForge.Core.Scoping;
using ArchiForge.Contracts.ProductLearning;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchiForge.Api.Controllers;

/// <summary>
/// Scoped read APIs for pilot feedback rollups: dashboard KPIs, improvement opportunities, artifact trends, and triage queue slices.
/// </summary>
/// <remarks>
/// Base route <c>v1/product-learning</c>. Aligns with <see cref="ProductLearningScope"/> from <see cref="IScopeContextProvider"/>.
/// </remarks>
[ApiController]
[Authorize(Policy = ArchiForgePolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/product-learning")]
[EnableRateLimiting("fixed")]
public sealed class ProductLearningController(
    IProductLearningDashboardService dashboardService,
    IScopeContextProvider scopeProvider)
    : ControllerBase
{
    /// <summary>KPIs and explanatory notes only (no aggregate arrays).</summary>
    [HttpGet("summary")]
    [ProducesResponseType(typeof(ProductLearningDashboardSummaryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetSummary([FromQuery] string? since, CancellationToken cancellationToken)
    {
        if (!ProductLearningQueryParser.TryParseOptionalSince(since, out DateTime? sinceUtc, out string? sinceError))
        {
            return this.BadRequestProblem(sinceError!, ProblemTypes.ValidationFailed);
        }

        ScopeContext scopeContext = scopeProvider.GetCurrentScope();
        ProductLearningScope scope = ToProductLearningScope(scopeContext);

        ProductLearningTriageOptions options = new() { SinceUtc = sinceUtc };

        LearningDashboardSummary full = await dashboardService.GetDashboardSummaryAsync(scope, options, cancellationToken);

        ProductLearningDashboardSummaryResponse body = new()
        {
            GeneratedUtc = full.GeneratedUtc,
            TenantId = full.TenantId,
            WorkspaceId = full.WorkspaceId,
            ProjectId = full.ProjectId,
            TotalSignalsInScope = full.TotalSignalsInScope,
            DistinctRunsTouched = full.DistinctRunsTouched,
            TopAggregateCount = full.TopAggregates.Count,
            ArtifactTrendCount = full.ArtifactTrends.Count,
            ImprovementOpportunityCount = full.Opportunities.Count,
            TriageQueueItemCount = full.TriageQueue.Count,
            SummaryNotes = full.SummaryNotes,
        };

        return Ok(body);
    }

    /// <summary>Top improvement opportunities after deterministic ranking (cap via <c>maxOpportunities</c>).</summary>
    [HttpGet("improvement-opportunities")]
    [ProducesResponseType(typeof(ProductLearningImprovementOpportunitiesResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetImprovementOpportunities(
        [FromQuery] string? since,
        [FromQuery] string? maxOpportunities,
        CancellationToken cancellationToken)
    {
        if (!ProductLearningQueryParser.TryParseOptionalSince(since, out DateTime? sinceUtc, out string? sinceError))
        {
            return this.BadRequestProblem(sinceError!, ProblemTypes.ValidationFailed);
        }

        if (!ProductLearningQueryParser.TryParseMaxImprovementOpportunities(maxOpportunities, out int maxOpp, out string? maxError))
        {
            return this.BadRequestProblem(maxError!, ProblemTypes.ValidationFailed);
        }

        ScopeContext scopeContext = scopeProvider.GetCurrentScope();
        ProductLearningScope scope = ToProductLearningScope(scopeContext);

        ProductLearningTriageOptions options = new()
        {
            SinceUtc = sinceUtc,
            MaxImprovementOpportunities = maxOpp,
        };

        LearningDashboardSummary full = await dashboardService.GetDashboardSummaryAsync(scope, options, cancellationToken);

        return Ok(new ProductLearningImprovementOpportunitiesResponse
        {
            GeneratedUtc = full.GeneratedUtc,
            Opportunities = full.Opportunities,
        });
    }

    /// <summary>Artifact outcome trend rows for charts (same noise gates as the full dashboard).</summary>
    [HttpGet("artifact-outcome-trends")]
    [ProducesResponseType(typeof(ProductLearningArtifactOutcomeTrendsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetArtifactOutcomeTrends([FromQuery] string? since, CancellationToken cancellationToken)
    {
        if (!ProductLearningQueryParser.TryParseOptionalSince(since, out DateTime? sinceUtc, out string? sinceError))
        {
            return this.BadRequestProblem(sinceError!, ProblemTypes.ValidationFailed);
        }

        ScopeContext scopeContext = scopeProvider.GetCurrentScope();
        ProductLearningScope scope = ToProductLearningScope(scopeContext);

        ProductLearningTriageOptions options = new() { SinceUtc = sinceUtc };

        LearningDashboardSummary full = await dashboardService.GetDashboardSummaryAsync(scope, options, cancellationToken);

        return Ok(new ProductLearningArtifactOutcomeTrendsResponse
        {
            GeneratedUtc = full.GeneratedUtc,
            Trends = full.ArtifactTrends,
        });
    }

    /// <summary>Triage queue slice (merged opportunities + repeated-comment themes), ordered deterministically.</summary>
    [HttpGet("triage-queue")]
    [ProducesResponseType(typeof(ProductLearningTriageQueueResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetTriageQueue(
        [FromQuery] string? since,
        [FromQuery] string? maxTriageItems,
        CancellationToken cancellationToken)
    {
        if (!ProductLearningQueryParser.TryParseOptionalSince(since, out DateTime? sinceUtc, out string? sinceError))
        {
            return this.BadRequestProblem(sinceError!, ProblemTypes.ValidationFailed);
        }

        if (!ProductLearningQueryParser.TryParseMaxTriageQueueItems(maxTriageItems, out int maxTriage, out string? maxError))
        {
            return this.BadRequestProblem(maxError!, ProblemTypes.ValidationFailed);
        }

        ScopeContext scopeContext = scopeProvider.GetCurrentScope();
        ProductLearningScope scope = ToProductLearningScope(scopeContext);

        ProductLearningTriageOptions options = new()
        {
            SinceUtc = sinceUtc,
            MaxTriageQueueItems = maxTriage,
        };

        LearningDashboardSummary full = await dashboardService.GetDashboardSummaryAsync(scope, options, cancellationToken);

        return Ok(new ProductLearningTriageQueueResponse
        {
            GeneratedUtc = full.GeneratedUtc,
            Items = full.TriageQueue,
        });
    }

    private static ProductLearningScope ToProductLearningScope(ScopeContext scopeContext)
    {
        if (scopeContext is null)
        {
            throw new ArgumentNullException(nameof(scopeContext));
        }

        return new ProductLearningScope
        {
            TenantId = scopeContext.TenantId,
            WorkspaceId = scopeContext.WorkspaceId,
            ProjectId = scopeContext.ProjectId,
        };
    }
}
