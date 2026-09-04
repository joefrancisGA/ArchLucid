using ArchLucid.Api.Attributes;
using ArchLucid.Api.Models.Pilots;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Pilots;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Tenancy;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Pilots;

public sealed partial class PilotsController
{
    [HttpGet("runs/{runId}/sponsor-review-packet")]
    [Produces("text/markdown")]
    [ProducesResponseType(typeof(string), StatusCodes.Status200OK, "text/markdown")]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetExecutiveReviewPacket(string runId, CancellationToken cancellationToken)
    {
        try
        {
            string? markdown = await _pilots.TryBuildExecutiveReviewPacketMarkdownAsync(runId, cancellationToken);

            return markdown is null
                ? this.NotFoundProblem($"Sponsor review packet is not available for run '{runId}'.", ProblemTypes.RunNotFound)
                : Content(markdown, "text/markdown; charset=utf-8");
        }
catch (ConflictException ex)
{
    string problemType = ex.Message.Contains("hash verification failed", StringComparison.OrdinalIgnoreCase)
        ? ProblemTypes.DecisionReceiptSealedHashMismatch
        : ex.Message.Contains("fields are incomplete", StringComparison.OrdinalIgnoreCase)
            ? ProblemTypes.DecisionReceiptSealedIncomplete
            : ProblemTypes.Conflict;

    return this.ConflictProblem(ex.Message, problemType);
}
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
}
