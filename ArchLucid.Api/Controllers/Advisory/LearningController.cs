using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Api.Attributes;
using ArchLucid.Api.Learning;
using ArchLucid.Api.Models.Learning;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.ProductLearning;
using ArchLucid.Api.Services;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.Abstractions.ProductLearning;
using ArchLucid.Contracts.ProductLearning;
using ArchLucid.Contracts.ProductLearning.Planning;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Coordination.ProductLearning.Planning;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Advisory;

/// <summary>
///     59R learning-to-planning APIs: themes, improvement plans, deterministic materialization, exports, and KPIs.
/// </summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/learning")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class LearningController(
    ILearningPlanningReadService learningReadService,
    IProductLearningPlanningDerivationService planningDerivationService,
    IActorContext actorContext,
    IScopeContextProvider scopeProvider,
    IAuditService auditService)
    : ControllerBase
{
    private static readonly JsonSerializerOptions ReportFileJsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        WriteIndented = true
    };

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
        LearningPlansListResponse body = await learningReadService.GetPlansAsync(scope, take, cancellationToken);

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

    /// <summary>
    ///     Bounded export: markdown (JSON wrapper) or structured JSON — top themes, prioritized plans, and evidence
    ///     references.
    /// </summary>
    [HttpGet("report")]
    [ProducesResponseType(typeof(LearningPlanningReportExportResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(LearningPlanningReportDocument), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetPlanningReport(
        [FromQuery] string? maxThemes,
        [FromQuery] string? maxPlans,
        [FromQuery] string? format,
        [FromQuery] string? maxReportSignalLinks,
        [FromQuery] string? maxReportArtifactLinks,
        [FromQuery] string? maxReportRunLinks,
        CancellationToken cancellationToken)
    {
        if (!LearningPlanningQueryParser.TryParseMaxItems(maxThemes, "maxThemes", out int themeTake,
                out string? themeError))
            return this.BadRequestProblem(themeError!, ProblemTypes.ValidationFailed);

        if (!LearningPlanningQueryParser.TryParseMaxItems(maxPlans, "maxPlans", out int planTake,
                out string? planError))
            return this.BadRequestProblem(planError!, ProblemTypes.ValidationFailed);

        if (!LearningPlanningQueryParser.TryParseReportFormat(format, out string formatNorm, out string? formatError))
            return this.BadRequestProblem(formatError!, ProblemTypes.ValidationFailed);

        if (!LearningPlanningQueryParser.TryParseMaxReportSignalLinksPerPlan(
                maxReportSignalLinks,
                out int maxSig,
                out string? sigError))
            return this.BadRequestProblem(sigError!, ProblemTypes.ValidationFailed);

        if (!LearningPlanningQueryParser.TryParseMaxReportArtifactLinksPerPlan(
                maxReportArtifactLinks,
                out int maxArt,
                out string? artError))
            return this.BadRequestProblem(artError!, ProblemTypes.ValidationFailed);

        if (!LearningPlanningQueryParser.TryParseMaxReportRunLinksPerPlan(maxReportRunLinks, out int maxRun,
                out string? runError))
            return this.BadRequestProblem(runError!, ProblemTypes.ValidationFailed);

        ProductLearningScope scope = ToProductLearningScope(scopeProvider.GetCurrentScope());

        LearningPlanningReportLimits limits = new()
        {
            MaxThemes = themeTake,
            MaxPlans = planTake,
            MaxSignalRefsPerPlan = maxSig,
            MaxArtifactRefsPerPlan = maxArt,
            MaxRunRefsPerPlan = maxRun
        };

        LearningPlanningReportDocument document =
            await learningReadService.GetPlanningReportAsync(scope, limits, cancellationToken);

        if (formatNorm == "json")
            return Ok(document);

        string markdown = LearningPlanningReportMarkdownFormatter.Format(document);

        return Ok(
            new LearningPlanningReportExportResponse
            {
                Format = "markdown", FileName = "learning-planning-report-59r.md", Content = markdown
            });
    }

    /// <summary>Same payload as <see cref="GetPlanningReport" /> as a downloadable <c>.md</c> or <c>.json</c> file.</summary>
    [HttpGet("report/file")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DownloadPlanningReport(
        [FromQuery] string? maxThemes,
        [FromQuery] string? maxPlans,
        [FromQuery] string? format,
        [FromQuery] string? maxReportSignalLinks,
        [FromQuery] string? maxReportArtifactLinks,
        [FromQuery] string? maxReportRunLinks,
        CancellationToken cancellationToken)
    {
        if (!LearningPlanningQueryParser.TryParseMaxItems(maxThemes, "maxThemes", out int themeTake,
                out string? themeError))
            return this.BadRequestProblem(themeError!, ProblemTypes.ValidationFailed);

        if (!LearningPlanningQueryParser.TryParseMaxItems(maxPlans, "maxPlans", out int planTake,
                out string? planError))
            return this.BadRequestProblem(planError!, ProblemTypes.ValidationFailed);

        if (!LearningPlanningQueryParser.TryParseReportFormat(format, out string formatNorm, out string? formatError))
            return this.BadRequestProblem(formatError!, ProblemTypes.ValidationFailed);

        if (!LearningPlanningQueryParser.TryParseMaxReportSignalLinksPerPlan(
                maxReportSignalLinks,
                out int maxSig,
                out string? sigError))
            return this.BadRequestProblem(sigError!, ProblemTypes.ValidationFailed);

        if (!LearningPlanningQueryParser.TryParseMaxReportArtifactLinksPerPlan(
                maxReportArtifactLinks,
                out int maxArt,
                out string? artError))
            return this.BadRequestProblem(artError!, ProblemTypes.ValidationFailed);

        if (!LearningPlanningQueryParser.TryParseMaxReportRunLinksPerPlan(maxReportRunLinks, out int maxRun,
                out string? runError))
            return this.BadRequestProblem(runError!, ProblemTypes.ValidationFailed);

        ProductLearningScope scope = ToProductLearningScope(scopeProvider.GetCurrentScope());

        LearningPlanningReportLimits limits = new()
        {
            MaxThemes = themeTake,
            MaxPlans = planTake,
            MaxSignalRefsPerPlan = maxSig,
            MaxArtifactRefsPerPlan = maxArt,
            MaxRunRefsPerPlan = maxRun
        };

        LearningPlanningReportDocument document =
            await learningReadService.GetPlanningReportAsync(scope, limits, cancellationToken);

        if (formatNorm == "json")
        {
            string json = JsonSerializer.Serialize(document, ReportFileJsonOptions);

            return ApiFileResults.RangeText(Request, json, "application/json", "learning-planning-report-59r.json");
        }

        string markdown = LearningPlanningReportMarkdownFormatter.Format(document);

        return ApiFileResults.RangeText(Request, markdown, "text/markdown", "learning-planning-report-59r.md");
    }

    /// <summary>
    ///     Persists deterministic themes and bounded draft plans from ranked pilot-feedback opportunities (59R). Operator-
    ///     triggered — does not mutate agents, prompts, or governance packs.
    /// </summary>
    [HttpPost("planning/materialize")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(ProductLearningPlanningMaterializeResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> MaterializePlanningDrafts(
        [FromQuery] string? since,
        [FromQuery] string? maxPlansToMaterialize,
        CancellationToken cancellationToken)
    {
        if (!ProductLearningQueryParser.TryParseOptionalSince(since, out DateTime? sinceUtc, out string? sinceError))
            return this.BadRequestProblem(sinceError!, ProblemTypes.ValidationFailed);

        if (!LearningPlanningQueryParser.TryParseMaxPlansToMaterialize(maxPlansToMaterialize, out int maxPlans,
                out string? maxError))
            return this.BadRequestProblem(maxError!, ProblemTypes.ValidationFailed);

        ProductLearningTriageOptions triage = new()
        {
            SinceUtc = sinceUtc,
            MaxImprovementOpportunities = ProductLearningQueryParser.DefaultMaxImprovementOpportunities
        };

        ProductLearningScope scope = ToProductLearningScope(scopeProvider.GetCurrentScope());

        ProductLearningPlanningMaterializeResult result =
            await planningDerivationService.MaterializeFromRankedOpportunitiesAsync(
                    scope,
                    triage,
                    actorContext.GetActorId(),
                    maxPlans,
                    cancellationToken)
                .ConfigureAwait(false);

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.ProductLearningPlanningMaterialized,
                DataJson = JsonSerializer.Serialize(new
                {
                    sinceUtc,
                    maxPlansToMaterialize = maxPlans,
                    themesInserted = result.ThemesInserted,
                    plansInserted = result.PlansInserted,
                    skippedExistingThemeKeys = result.SkippedExistingThemeKeys,
                    signalLinksInserted = result.SignalLinksInserted
                })
            },
            cancellationToken);

        return Ok(result);
    }

    private static ProductLearningScope ToProductLearningScope(ScopeContext scopeContext)
    {
        return scopeContext is null
            ? throw new ArgumentNullException(nameof(scopeContext))
            : new ProductLearningScope
            {
                TenantId = scopeContext.TenantId,
                WorkspaceId = scopeContext.WorkspaceId,
                ProjectId = scopeContext.ProjectId
            };
    }
}
