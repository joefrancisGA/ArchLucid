using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Api.Learning;
using ArchLucid.Api.Models.Learning;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.ProductLearning;
using ArchLucid.Api.Services;
using ArchLucid.Contracts.Abstractions.ProductLearning;
using ArchLucid.Contracts.ProductLearning;
using ArchLucid.Contracts.ProductLearning.Planning;
using ArchLucid.Persistence.Coordination.ProductLearning.Planning;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Advisory;

public sealed partial class LearningController
{
    private static readonly JsonSerializerOptions ReportFileJsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        WriteIndented = true
    };

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
    [Produces("text/markdown", "application/json")]
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
}
