using ArchLucid.Api.Http;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Analysis;
using ArchLucid.Core.Authorization;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Planning;

public sealed partial class ComparisonsController
{
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("comparisons/{comparisonRecordId}/drift")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(DriftAnalysisResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AnalyzeComparisonDrift(
        [FromRoute] string comparisonRecordId,
        CancellationToken cancellationToken)
    {
        DriftAnalysisResult? drift = await _comparisons.TryAnalyzeDriftAsync(comparisonRecordId, cancellationToken);

        return drift is null
            ? this.NotFoundProblem($"Comparison record '{comparisonRecordId}' was not found.", ProblemTypes.ResourceNotFound)
            : Ok(MapDriftAnalysis(drift));
    }

    [HttpGet("comparisons/{comparisonRecordId}/drift-report")]
    [Authorize(Policy = ArchLucidPolicies.CanReplayComparisons)]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetComparisonDriftReport(
        [FromRoute] string comparisonRecordId,
        [FromQuery] string format = "markdown",
        CancellationToken cancellationToken = default)
    {
        DriftAnalysisResult? drift = await _comparisons.TryAnalyzeDriftAsync(comparisonRecordId, cancellationToken);

        if (drift is null)
        {
            return this.NotFoundProblem($"Comparison record '{comparisonRecordId}' was not found.",
                ProblemTypes.ResourceNotFound);
        }

        DriftReportContent? content = _comparisons.TryBuildDriftReportContent(drift, comparisonRecordId, format);

        if (content is null)
        {
            return this.BadRequestProblem(
                $"Unsupported drift report format '{format}'. Use markdown, html, or docx.",
                ProblemTypes.BadRequest);
        }

        return content.IsText
            ? ApiFileResults.RangeText(Request, content.TextPayload!, content.ContentType, content.FileName)
            : ApiFileResults.RangeBytes(Request, content.Payload, content.ContentType, content.FileName);
    }

    private static DriftAnalysisResponse MapDriftAnalysis(DriftAnalysisResult drift) =>
        new()
        {
            DriftDetected = drift.DriftDetected,
            Summary = drift.Summary,
            Items = drift.Items.Select(i => new DriftItemResponse
            {
                Category = i.Category,
                Path = i.Path,
                StoredValue = i.StoredValue,
                RegeneratedValue = i.RegeneratedValue,
                Description = i.Description,
            }).ToList(),
        };
}
