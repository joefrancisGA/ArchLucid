using ArchLucid.Api.Attributes;
using ArchLucid.Api.Models.Pilots;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Pilots;
using ArchLucid.Contracts.Roi;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Tenancy;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Pilots;

/// <summary>
///     Pilot-facing read models (sponsor summaries, scorecards).
/// </summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/pilots")]
[EnableRateLimiting("fixed")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public sealed class PilotsController(IPilotsApplicationService pilots) : ControllerBase
{
    private readonly IPilotsApplicationService _pilots =
        pilots ?? throw new ArgumentNullException(nameof(pilots));

    [HttpGet("why-archlucid-snapshot")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(WhyArchLucidSnapshotResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<WhyArchLucidSnapshotResponse>> GetWhyArchLucidSnapshot(
        CancellationToken cancellationToken)
    {
        WhyArchLucidSnapshotResponse snapshot = await _pilots.GetWhyArchLucidSnapshotAsync(cancellationToken);

        return Ok(snapshot);
    }

    [HttpGet("sponsor-evidence-pack")]
    [RequiresCommercialTenantTier(TenantTier.Standard)]
    [Produces("application/json")]
    [ProducesResponseType(typeof(SponsorEvidencePackResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<SponsorEvidencePackResponse>> GetSponsorEvidencePack(
        CancellationToken cancellationToken)
    {
        SponsorEvidencePackResponse pack = await _pilots.GetSponsorEvidencePackAsync(cancellationToken);

        return Ok(pack);
    }

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

    [HttpGet("runs/{runId}/sponsor-review-packet")]
    [Produces("text/markdown")]
    [ProducesResponseType(typeof(string), StatusCodes.Status200OK, "text/markdown")]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetExecutiveReviewPacket(string runId, CancellationToken cancellationToken)
    {
        string? markdown = await _pilots.TryBuildExecutiveReviewPacketMarkdownAsync(runId, cancellationToken);

        return markdown is null
            ? this.NotFoundProblem($"Sponsor review packet is not available for run '{runId}'.", ProblemTypes.RunNotFound)
            : Content(markdown, "text/markdown; charset=utf-8");
    }

    [HttpGet("runs/{runId}/sponsor-proof-pack.zip")]
    [Produces("application/zip")]
    [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetSponsorProofPackZip(string runId, CancellationToken cancellationToken)
    {
        string baseForLinks = $"{Request.Scheme}://{Request.Host.Value}";
        BuyerProofPackBuildResult? result = await _pilots.TryBuildSponsorProofPackZipAsync(
            runId,
            baseForLinks,
            HttpContext.TraceIdentifier,
            cancellationToken);

        if (result is null)
        {
            return this.NotFoundProblem(
                $"Sponsor proof pack is not available for run '{runId}'. Commit the run and retry.",
                ProblemTypes.RunNotFound);
        }

        return File(result.ZipBytes, "application/zip", result.FileName);
    }

    [HttpGet("runs/{runId}/first-value-report")]
    [Produces("text/markdown")]
    [ProducesResponseType(typeof(string), StatusCodes.Status200OK, "text/markdown")]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetFirstValueReport(string runId, CancellationToken cancellationToken)
    {
        string baseForLinks = $"{Request.Scheme}://{Request.Host.Value}";
        string? markdown = await _pilots.TryBuildFirstValueReportMarkdownAsync(runId, baseForLinks, cancellationToken);

        return markdown is null
            ? this.NotFoundProblem($"First-value report is not available for run '{runId}'.", ProblemTypes.RunNotFound)
            : Content(markdown, "text/markdown; charset=utf-8");
    }

    [HttpGet("runs/{runId}/pilot-run-deltas")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(PilotRunDeltasResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPilotRunDeltas(string runId, CancellationToken cancellationToken)
    {
        PilotRunDeltasResponse? response = await _pilots.TryGetPilotRunDeltasAsync(runId, cancellationToken);

        return response is null
            ? this.NotFoundProblem($"Run '{runId}' was not found (or is out of scope).", ProblemTypes.RunNotFound)
            : Ok(response);
    }

    [HttpGet("runs/recent-deltas")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(RecentPilotRunDeltasResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<RecentPilotRunDeltasResponse>> GetRecentDeltas(
        [FromQuery(Name = "count")] int? count,
        CancellationToken cancellationToken)
    {
        RecentPilotRunDeltasResponse response = await _pilots.GetRecentDeltasAsync(count, cancellationToken);

        return Ok(response);
    }

    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("runs/{runId}/first-value-report.pdf")]
    [Produces("application/pdf")]
    [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> PostFirstValueReportPdf(string runId, CancellationToken cancellationToken)
    {
        string baseForLinks = $"{Request.Scheme}://{Request.Host.Value}";

        try
        {
            byte[]? pdf = await _pilots.TryBuildFirstValueReportPdfAsync(runId, baseForLinks, cancellationToken);

            return pdf is null
                ? this.NotFoundProblem(
                    $"First-value report PDF is not available for run '{runId}'.",
                    ProblemTypes.RunNotFound)
                : File(pdf, "application/pdf", $"first-value-report-{runId}.pdf");
        }
        catch (SponsorFirstValuePdfBlockedException ex)
        {
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }
    }

    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("runs/{runId}/sponsor-pack-sent")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [MutatingAuditExcluded("Audit: IPilotsApplicationService.RecordSponsorPackSentAsync logs SponsorEvidencePackSent.")]
    public async Task<IActionResult> PostSponsorPackSent(
        string runId,
        [FromBody] SponsorPackSentPostRequest? body,
        CancellationToken cancellationToken)
    {
        SponsorPackSentResult result = await _pilots.RecordSponsorPackSentAsync(
            runId,
            body?.DeliveryMethod,
            body?.RecipientEmail,
            HttpContext.TraceIdentifier,
            cancellationToken);

        return result.Outcome switch
        {
            SponsorPackSentOutcome.RunNotFound => this.NotFoundProblem(
                $"Run '{runId}' was not found (or is out of scope).",
                ProblemTypes.RunNotFound),
            SponsorPackSentOutcome.NotCommitted => this.ConflictProblem(
                "Sponsor pack delivery can only be recorded after the review is committed.",
                ProblemTypes.Conflict),
            SponsorPackSentOutcome.Recorded => NoContent(),
            _ => throw new InvalidOperationException($"Unexpected outcome {result.Outcome}."),
        };
    }

    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("runs/{runId}/sponsor-preliminary-share")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [MutatingAuditExcluded("Audit: IPilotsApplicationService.RecordSponsorPreliminaryShareAsync logs SponsorPreliminaryArchitectureShared.")]
    public async Task<IActionResult> PostSponsorPreliminaryShare(
        string runId,
        [FromBody] SponsorPreliminarySharePostRequest? body,
        CancellationToken cancellationToken)
    {
        SponsorPreliminaryShareResult result = await _pilots.RecordSponsorPreliminaryShareAsync(
            runId,
            body?.ReadinessStatus,
            body?.KnownGaps ?? Array.Empty<string>(),
            body?.OverrideAcknowledged,
            body?.ConfidentialityLabel,
            body?.DeliveryMethod,
            HttpContext.TraceIdentifier,
            cancellationToken);

        return result.Outcome switch
        {
            SponsorPreliminaryShareOutcome.RunNotFound => this.NotFoundProblem(
                $"Run '{runId}' was not found (or is out of scope).",
                ProblemTypes.RunNotFound),
            SponsorPreliminaryShareOutcome.OverrideRequired => this.ConflictProblem(
                "Preliminary sponsor sharing requires explicit override acknowledgement when readiness is not Ready.",
                ProblemTypes.Conflict),
            SponsorPreliminaryShareOutcome.Recorded => NoContent(),
            _ => throw new InvalidOperationException($"Unexpected outcome {result.Outcome}."),
        };
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

    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("runs/{runId}/sponsor-one-pager")]
    [RequiresCommercialTenantTier(TenantTier.Standard)]
    [Produces("application/pdf")]
    [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> PostSponsorOnePager(string runId, CancellationToken cancellationToken)
    {
        string baseForLinks = $"{Request.Scheme}://{Request.Host.Value}";
        byte[]? pdf = await _pilots.TryBuildSponsorOnePagerPdfAsync(runId, baseForLinks, cancellationToken);

        return pdf is null
            ? this.NotFoundProblem($"Sponsor one-pager is not available for run '{runId}'.", ProblemTypes.RunNotFound)
            : File(pdf, "application/pdf", $"sponsor-one-pager-{runId}.pdf");
    }

    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("closeout")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [MutatingAuditExcluded("Audit: IPilotsApplicationService.CreateCloseoutAsync logs PilotCloseoutRecorded.")]
    public async Task<IActionResult> PostCloseout(
        [FromBody] PilotCloseoutPostRequest? body,
        CancellationToken cancellationToken)
    {
        if (body is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.ValidationFailed);

        try
        {
            PilotCloseoutCreateResult result = await _pilots.CreateCloseoutAsync(
                body.RunId,
                body.BaselineHours,
                body.SpeedScore,
                body.ManifestPackageScore,
                body.TraceabilityScore,
                body.Notes,
                cancellationToken);

            return StatusCode(StatusCodes.Status201Created, new { closeoutId = result.CloseoutId });
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
