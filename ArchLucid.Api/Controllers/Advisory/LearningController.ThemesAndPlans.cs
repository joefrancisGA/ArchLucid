using ArchLucid.Api.Learning;
using ArchLucid.Api.Models.Learning;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.ProductLearning;
using ArchLucid.Contracts.Abstractions.ProductLearning;
using ArchLucid.Contracts.ProductLearning;
using ArchLucid.Core.Diagnostics;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Advisory;

public sealed partial class LearningController
{
    /// <summary>Lists improvement themes for the current scope (newest first).</summary>
    [HttpGet("themes")]
    [ProducesResponseType(typeof(LearningThemesListResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetThemes(
        [FromQuery] string? maxThemes,
        CancellationToken cancellationToken)
    {
        if (!LearningPlanningQueryParser.TryParseMaxItems(maxThemes, "maxThemes", out int take, out string? maxError))
            return this.BadRequestProblem(maxError!, ProblemTypes.ValidationFailed);

        ProductLearningScope scope = ToProductLearningScope(scopeProvider.GetCurrentScope());
        LearningThemesListResponse body = await learningReadService.GetThemesAsync(scope, take, cancellationToken);

        return Ok(body);
    }

    /// <summary>Lists improvement plans for the current scope (newest first), with theme evidence counts when resolvable.</summary>
    [HttpGet("plans")]
    [ProducesResponseType(typeof(LearningPlansListResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetPlans(
        [FromQuery] string? maxPlans,
        CancellationToken cancellationToken)
    {
        if (!LearningPlanningQueryParser.TryParseMaxItems(maxPlans, "maxPlans", out int take, out string? maxError))
            return this.BadRequestProblem(maxError!, ProblemTypes.ValidationFailed);

        ProductLearningScope scope = ToProductLearningScope(scopeProvider.GetCurrentScope());

        LearningPlansHangDiagnostics.Log(
            "controller_get_plans_entered",
            ("correlationId", HttpContext.TraceIdentifier),
            ("maxPlans", take),
            ("tenantId", scope.TenantId),
            ("workspaceId", scope.WorkspaceId),
            ("projectId", scope.ProjectId));

        long startedMs = Environment.TickCount64;
        LearningPlansListResponse body = await learningReadService.GetPlansAsync(scope, take, cancellationToken);

        LearningPlansHangDiagnostics.Log(
            "controller_get_plans_completed",
            ("correlationId", HttpContext.TraceIdentifier),
            ("durationMs", Environment.TickCount64 - startedMs),
            ("planCount", body.Plans.Count));

        return Ok(body);
    }

    /// <summary>Loads a single improvement plan with action steps, link counts, and optional parent theme.</summary>
    [HttpGet("plans/{id}")]
    [ProducesResponseType(typeof(LearningPlanDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPlanById(string id, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(id))
            return this.BadRequestProblem("Path parameter 'id' is required.", ProblemTypes.ValidationFailed);

        if (!Guid.TryParse(id.Trim(), out Guid planId))
            return this.BadRequestProblem("Path parameter 'id' must be a valid GUID.", ProblemTypes.ValidationFailed);

        ProductLearningScope scope = ToProductLearningScope(scopeProvider.GetCurrentScope());
        LearningPlanDetailResponse? plan =
            await learningReadService.GetPlanByIdAsync(planId, scope, cancellationToken);

        if (plan is null)
            return this.NotFoundProblem(
                $"Improvement plan '{planId}' was not found in the current scope.",
                ProblemTypes.LearningImprovementPlanNotFound);

        return Ok(plan);
    }

    /// <summary>Aggregated KPIs: theme/plan counts, theme evidence totals, max plan priority, linked signal totals.</summary>
    [HttpGet("summary")]
    [ProducesResponseType(typeof(LearningSummaryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetSummary(
        [FromQuery] string? maxThemes,
        [FromQuery] string? maxPlans,
        CancellationToken cancellationToken)
    {
        if (!LearningPlanningQueryParser.TryParseMaxItems(maxThemes, "maxThemes", out int themeTake,
                out string? themeError))
            return this.BadRequestProblem(themeError!, ProblemTypes.ValidationFailed);

        if (!LearningPlanningQueryParser.TryParseMaxItems(maxPlans, "maxPlans", out int planTake,
                out string? planError))
            return this.BadRequestProblem(planError!, ProblemTypes.ValidationFailed);

        ProductLearningScope scope = ToProductLearningScope(scopeProvider.GetCurrentScope());
        LearningSummaryResponse body =
            await learningReadService.GetSummaryAsync(scope, themeTake, planTake, cancellationToken);

        return Ok(body);
    }

    /// <summary>Planning list view bundle: summary KPIs, themes, and plans from one scoped read pass.</summary>
    [HttpGet("list-bundle")]
    [ProducesResponseType(typeof(LearningPlanningListBundleResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetListBundle(
        [FromQuery] string? maxThemes,
        [FromQuery] string? maxPlans,
        CancellationToken cancellationToken)
    {
        if (!LearningPlanningQueryParser.TryParseMaxItems(maxThemes, "maxThemes", out int themeTake,
                out string? themeError))
            return this.BadRequestProblem(themeError!, ProblemTypes.ValidationFailed);

        if (!LearningPlanningQueryParser.TryParseMaxItems(maxPlans, "maxPlans", out int planTake,
                out string? planError))
            return this.BadRequestProblem(planError!, ProblemTypes.ValidationFailed);

        ProductLearningScope scope = ToProductLearningScope(scopeProvider.GetCurrentScope());
        LearningPlanningListBundleResponse body =
            await learningReadService.GetListBundleAsync(scope, themeTake, planTake, cancellationToken);

        return Ok(body);
    }
}
