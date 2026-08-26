using System.Text.Json;

using ArchLucid.Api.Models.ProductLearning;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.ProductLearning;
using ArchLucid.Contracts.Abstractions.ProductLearning;
using ArchLucid.Contracts.ProductLearning;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Advisory;

public sealed partial class ProductLearningController
{
    /// <summary>KPIs and explanatory notes only (no aggregate arrays).</summary>
    [HttpGet("summary")]
    [ProducesResponseType(typeof(ProductLearningDashboardSummaryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetSummary([FromQuery] string? since, CancellationToken cancellationToken)
    {
        if (!ProductLearningQueryParser.TryParseOptionalSince(since, out DateTime? sinceUtc, out string? sinceError))
            return this.BadRequestProblem(sinceError!, ProblemTypes.ValidationFailed);

        ScopeContext scopeContext = scopeProvider.GetCurrentScope();
        ProductLearningScope scope = ToProductLearningScope(scopeContext);

        ProductLearningTriageOptions options = new() { SinceUtc = sinceUtc };

        LearningDashboardSummary full =
            await dashboardService.GetDashboardSummaryAsync(scope, options, cancellationToken);

        return Ok(ProductLearningDashboardSlicesMapper.MapSummary(full));
    }

    /// <summary>All dashboard slices from one scoped rollup (summary, opportunities, trends, triage).</summary>
    [HttpGet("dashboard")]
    [ProducesResponseType(typeof(ProductLearningDashboardBundleResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetDashboard([FromQuery] string? since, CancellationToken cancellationToken)
    {
        if (!ProductLearningQueryParser.TryParseOptionalSince(since, out DateTime? sinceUtc, out string? sinceError))
            return this.BadRequestProblem(sinceError!, ProblemTypes.ValidationFailed);

        ScopeContext scopeContext = scopeProvider.GetCurrentScope();
        ProductLearningScope scope = ToProductLearningScope(scopeContext);

        ProductLearningTriageOptions options = new() { SinceUtc = sinceUtc };

        LearningDashboardSummary full =
            await dashboardService.GetDashboardSummaryAsync(scope, options, cancellationToken);

        return Ok(ProductLearningDashboardSlicesMapper.MapBundle(full));
    }

    /// <summary>Captures a scoped pilot feedback signal from a visible review output.</summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("signals")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> PostSignal(
        [FromBody] ProductLearningSignalRequest? request,
        CancellationToken cancellationToken)
    {
        if (request is null) return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        string subjectType = NormalizeRequired(request.SubjectType);
        string disposition = NormalizeRequired(request.Disposition);

        if (string.IsNullOrWhiteSpace(subjectType)) return this.BadRequestProblem("SubjectType is required.", ProblemTypes.ValidationFailed);

        if (!IsAllowedDisposition(disposition))
            return this.BadRequestProblem(
                "Disposition must be Trusted, Rejected, Revised, or NeedsFollowUp.",
                ProblemTypes.ValidationFailed);

        ScopeContext scopeContext = scopeProvider.GetCurrentScope();
        ProductLearningPilotSignalRecord signal = new()
        {
            TenantId = scopeContext.TenantId,
            WorkspaceId = scopeContext.WorkspaceId,
            ProjectId = scopeContext.ProjectId,
            ArchitectureRunId = NormalizeOptional(request.ArchitectureRunId, 64),
            AuthorityRunId = request.AuthorityRunId,
            ManifestVersion = NormalizeOptional(request.ManifestVersion, 128),
            SubjectType = subjectType,
            Disposition = disposition,
            PatternKey = NormalizeOptional(request.PatternKey, 200),
            ArtifactHint = NormalizeOptional(request.ArtifactHint, 512),
            CommentShort = NormalizeOptional(request.CommentShort, 2000),
            DetailJson = NormalizeOptional(request.DetailJson, 4000),
            RecordedByUserId = actorContext.GetActorId(),
            RecordedByDisplayName = actorContext.GetActor()
        };

        await pilotSignalRepository.InsertAsync(signal, cancellationToken);

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.ProductLearningPilotSignalRecorded,
                DataJson = JsonSerializer.Serialize(new
                {
                    subjectType = signal.SubjectType,
                    disposition = signal.Disposition,
                    patternKey = signal.PatternKey
                })
            },
            cancellationToken);

        return NoContent();
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
            return this.BadRequestProblem(sinceError!, ProblemTypes.ValidationFailed);

        if (!ProductLearningQueryParser.TryParseMaxImprovementOpportunities(maxOpportunities, out int maxOpp,
                out string? maxError))
            return this.BadRequestProblem(maxError!, ProblemTypes.ValidationFailed);

        ScopeContext scopeContext = scopeProvider.GetCurrentScope();
        ProductLearningScope scope = ToProductLearningScope(scopeContext);

        ProductLearningTriageOptions options = new() { SinceUtc = sinceUtc, MaxImprovementOpportunities = maxOpp };

        LearningDashboardSummary full =
            await dashboardService.GetDashboardSummaryAsync(scope, options, cancellationToken);

        return Ok(ProductLearningDashboardSlicesMapper.MapOpportunities(full));
    }

    /// <summary>Artifact outcome trend rows for charts (same noise gates as the full dashboard).</summary>
    [HttpGet("artifact-outcome-trends")]
    [ProducesResponseType(typeof(ProductLearningArtifactOutcomeTrendsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetArtifactOutcomeTrends([FromQuery] string? since,
        CancellationToken cancellationToken)
    {
        if (!ProductLearningQueryParser.TryParseOptionalSince(since, out DateTime? sinceUtc, out string? sinceError))
            return this.BadRequestProblem(sinceError!, ProblemTypes.ValidationFailed);

        ScopeContext scopeContext = scopeProvider.GetCurrentScope();
        ProductLearningScope scope = ToProductLearningScope(scopeContext);

        ProductLearningTriageOptions options = new() { SinceUtc = sinceUtc };

        LearningDashboardSummary full =
            await dashboardService.GetDashboardSummaryAsync(scope, options, cancellationToken);

        return Ok(ProductLearningDashboardSlicesMapper.MapTrends(full));
    }

    private static bool IsAllowedDisposition(string disposition) =>
        disposition is ProductLearningDispositionValues.Trusted
            or ProductLearningDispositionValues.Rejected
            or ProductLearningDispositionValues.Revised
            or ProductLearningDispositionValues.NeedsFollowUp;

    private static string NormalizeRequired(string? value) => value?.Trim() ?? string.Empty;

    private static string? NormalizeOptional(string? value, int maxLength)
    {
        string? trimmed = value?.Trim();

        if (string.IsNullOrWhiteSpace(trimmed)) return null;

        return trimmed.Length <= maxLength ? trimmed : trimmed[..maxLength];
    }
}
