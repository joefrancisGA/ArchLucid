using ArchLucid.Api.Attributes;
using ArchLucid.Api.Models.Pilots;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Pilots;
using ArchLucid.Contracts.Roi;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Pilots;

public sealed partial class PilotsController
{
    [HttpGet("scorecard")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(PilotInProductScorecardResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<PilotInProductScorecardResponse>> GetInProductScorecard(
        CancellationToken cancellationToken)
    {
        PilotInProductScorecardResult result = await _pilots.GetInProductScorecardAsync(cancellationToken);

        return Ok(PilotInProductScorecardMapper.ToResponse(result));
    }

    [HttpPut("scorecard/baselines")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [MutatingAuditExcluded("Audit: IPilotsApplicationService.UpsertScorecardBaselinesAsync logs PilotScorecardBaselinesUpdated.")]
    public async Task<IActionResult> PutScorecardBaselines(
        [FromBody] PilotScorecardBaselinesPutRequest? body,
        CancellationToken cancellationToken)
    {
        await _pilots.UpsertScorecardBaselinesAsync(
            body?.BaselineHoursPerReview,
            body?.BaselineReviewsPerQuarter,
            body?.BaselineArchitectHourlyCost,
            "pilot-scorecard-baselines",
            cancellationToken);

        return NoContent();
    }

    [HttpGet("outcome-summary")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(PilotScorecardResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<PilotScorecardResponse>> GetOutcomeSummary(CancellationToken cancellationToken)
    {
        PilotScorecardSummary summary = await _pilots.GetOutcomeSummaryAsync(cancellationToken);

        return Ok(MapScorecardResponse(summary));
    }

    [HttpGet("report-card")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(PilotReportCard), StatusCodes.Status200OK)]
    public async Task<ActionResult<PilotReportCard>> GetReportCard(CancellationToken cancellationToken)
    {
        PilotReportCard report = await _pilots.GetReportCardAsync(cancellationToken);

        return Ok(report);
    }

    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("scorecard")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(PilotScorecardResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> PostScorecard(
        [FromBody] PilotScorecardPostRequest? body,
        CancellationToken cancellationToken)
    {
        try
        {
            PilotScorecardValueMetricsSubmission? metrics = body is null
                ? null
                : new PilotScorecardValueMetricsSubmission(
                    body.HoursSaved,
                    body.RisksMitigated,
                    body.QualitativeNotes?.Trim());

            PilotScorecardSummary summary = await _pilots.BuildScorecardAsync(
                body?.PeriodStart,
                body?.PeriodEnd,
                metrics,
                "pilot-scorecard-value-metrics",
                cancellationToken);

            PilotScorecardResponse response = MapScorecardResponse(summary);
            response.HoursSaved = body?.HoursSaved;
            response.RisksMitigated = body?.RisksMitigated;
            response.QualitativeNotes = body?.QualitativeNotes?.Trim();

            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
    }

    private static PilotScorecardResponse MapScorecardResponse(PilotScorecardSummary summary) =>
        new()
        {
            TenantId = summary.TenantId,
            PeriodStart = summary.PeriodStart,
            PeriodEnd = summary.PeriodEnd,
            RunsInPeriod = summary.RunsInPeriod,
            RunsWithCommittedManifest = summary.RunsWithCommittedManifest,
            ExtractorCollectionTimestampUtc = summary.ExtractorCollectionTimestampUtc,
            PeriodScopeCode = RoiSponsorFacingScopeCodes.PilotScorecardUtcWindow,
            PeriodScopeDescription = RoiSponsorFacingScopeDescriptions.ForPilotScorecardWindow(
                summary.PeriodStart,
                summary.PeriodEnd),
        };
}
