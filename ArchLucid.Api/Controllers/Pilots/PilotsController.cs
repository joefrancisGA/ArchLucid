using System.Text.Json;

using ArchLucid.Api.Attributes;
using ArchLucid.Api.Models.Pilots;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Common;
using ArchLucid.Application.Exports;
using ArchLucid.Application.Pilots;
using ArchLucid.Application.Value;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Pilots;
using ArchLucid.Contracts.ValueReports;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Pilots;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;

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
public sealed class PilotsController(
    FirstValueReportBuilder firstValueReportBuilder,
    IExecutiveReviewPacketBuilder executiveReviewPacketBuilder,
    FirstValueReportPdfBuilder firstValueReportPdfBuilder,
    PilotScorecardBuilder pilotScorecardBuilder,
    IPilotInProductScorecardService pilotInProductScorecardService,
    PilotOutcomeSummaryService pilotOutcomeSummaryService,
    IAzureExtractorPackageRepository azureExtractorPackageRepository,
    IPilotReportCardService pilotReportCardService,
    SponsorOnePagerPdfBuilder sponsorOnePagerPdfBuilder,
    IWhyArchLucidSnapshotService whyArchLucidSnapshotService,
    ISponsorEvidencePackService sponsorEvidencePackService,
    IRunDetailQueryService runDetailQueryService,
    IPilotRunDeltaComputer pilotRunDeltaComputer,
    IRecentPilotRunDeltasService recentPilotRunDeltasService,
    IPilotCloseoutRepository pilotCloseoutRepository,
    IAuditService auditService,
    ValueReportBuilder valueReportBuilder,
    IActorContext actorContext,
    IScopeContextProvider scopeContextProvider) : ControllerBase
{
    /// <summary>
    ///     Read-only telemetry snapshot for the operator-shell <c>/why-archlucid</c> proof page (cumulative since
    ///     API host start) plus the canonical Contoso Retail demo run id used by the page's other read endpoints.
    /// </summary>
    [HttpGet("why-archlucid-snapshot")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(WhyArchLucidSnapshotResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<WhyArchLucidSnapshotResponse>> GetWhyArchLucidSnapshot(
        CancellationToken cancellationToken)
    {
        WhyArchLucidSnapshotResponse snapshot = await whyArchLucidSnapshotService.BuildAsync(cancellationToken);

        return Ok(snapshot);
    }

    /// <summary>
    ///     Sponsor evidence pack: explainability completeness for the demo findings snapshot, live process counters,
    ///     value-report pilot deltas for the demo run, and governance headline counts. Standard tier (commercial floor
    ///     aligned with <see cref="ArchLucid.Api.Controllers.Tenancy.TenantMeasuredRoiController" />).
    /// </summary>
    [HttpGet("sponsor-evidence-pack")]
    [RequiresCommercialTenantTier(TenantTier.Standard)]
    [Produces("application/json")]
    [ProducesResponseType(typeof(SponsorEvidencePackResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<SponsorEvidencePackResponse>> GetSponsorEvidencePack(
        CancellationToken cancellationToken)
    {
        SponsorEvidencePackResponse pack = await sponsorEvidencePackService.BuildAsync(cancellationToken);

        return Ok(pack);
    }

    /// <summary>
    ///     In-product pilot scorecard: cumulative tenant metrics (SQL-backed), optional ROI baselines, and ROI estimate when
    ///     baselines are complete.
    /// </summary>
    [HttpGet("scorecard")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(PilotInProductScorecardResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<PilotInProductScorecardResponse>> GetInProductScorecard(
        CancellationToken cancellationToken)
    {
        PilotInProductScorecardResult result = await pilotInProductScorecardService.GetAsync(cancellationToken);

        return Ok(PilotInProductScorecardMapper.ToResponse(result));
    }

    /// <summary>Operator-entered pilot ROI baselines (tenant-scoped, durable audit on success).</summary>
    [HttpPut("scorecard/baselines")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> PutScorecardBaselines(
        [FromBody] PilotScorecardBaselinesPutRequest? body,
        CancellationToken cancellationToken)
    {
        decimal? h = body?.BaselineHoursPerReview;
        int? q = body?.BaselineReviewsPerQuarter;
        decimal? c = body?.BaselineArchitectHourlyCost;

        await pilotInProductScorecardService.UpsertBaselinesAsync(h, q, c, cancellationToken);

        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        string actor = actorContext.GetActor();
        string payload = JsonSerializer.Serialize(
            new { baselineHoursPerReview = h, baselineReviewsPerQuarter = q, baselineArchitectHourlyCost = c });

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.PilotScorecardBaselinesUpdated,
                ActorUserId = actor,
                ActorUserName = actor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = payload,
                CorrelationId = "pilot-scorecard-baselines"
            },
            cancellationToken);

        return NoContent();
    }

    /// <summary>Trailing 30-day pilot outcome rollup for the current tenant scope (cached ~60s).</summary>
    [HttpGet("outcome-summary")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(PilotScorecardResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<PilotScorecardResponse>> GetOutcomeSummary(CancellationToken cancellationToken)
    {
        PilotScorecardSummary summary = await pilotOutcomeSummaryService.GetTrailing30DaysAsync(cancellationToken);

        PilotScorecardResponse response = new()
        {
            TenantId = summary.TenantId,
            PeriodStart = summary.PeriodStart,
            PeriodEnd = summary.PeriodEnd,
            RunsInPeriod = summary.RunsInPeriod,
            RunsWithCommittedManifest = summary.RunsWithCommittedManifest,
            ExtractorCollectionTimestampUtc = summary.ExtractorCollectionTimestampUtc,
        };

        return Ok(response);
    }

    /// <summary>
    ///     JSON pilot report card: committed-run KPIs plus governance, export audits, synthesized artifact breadth for the
    ///     authenticated workspace scope.
    /// </summary>
    [HttpGet("report-card")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(PilotReportCard), StatusCodes.Status200OK)]
    public async Task<ActionResult<PilotReportCard>> GetReportCard(CancellationToken cancellationToken)
    {
        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        PilotReportCard report =
            await pilotReportCardService.GenerateReportCardAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId,
                cancellationToken);

        return Ok(report);
    }

    /// <summary>
    ///     Consolidated sponsor packet (manifest, findings, ROI basis by disposition, decisions) — one Markdown download.
    /// </summary>
    [HttpGet("runs/{runId}/executive-review-packet")]
    [Produces("text/markdown")]
    [ProducesResponseType(typeof(string), StatusCodes.Status200OK, "text/markdown")]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetExecutiveReviewPacket(string runId, CancellationToken cancellationToken)
    {
        string? markdown = await executiveReviewPacketBuilder.BuildMarkdownAsync(runId, cancellationToken);

        return markdown is null
            ? this.NotFoundProblem($"Executive review packet is not available for run '{runId}'.", ProblemTypes.RunNotFound)
            : Content(markdown, "text/markdown; charset=utf-8");
    }

    /// <summary>
    ///     Markdown summary suitable for a sponsor after a first committed run (read-only).
    /// </summary>
    [HttpGet("runs/{runId}/first-value-report")]
    [Produces("text/markdown")]
    [ProducesResponseType(typeof(string), StatusCodes.Status200OK, "text/markdown")]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetFirstValueReport(string runId, CancellationToken cancellationToken)
    {
        string baseForLinks = $"{Request.Scheme}://{Request.Host.Value}";
        string? markdown = await firstValueReportBuilder.BuildMarkdownAsync(runId, baseForLinks, cancellationToken);

        return markdown is null
            ? this.NotFoundProblem($"First-value report is not available for run '{runId}'.", ProblemTypes.RunNotFound)
            : Content(markdown, "text/markdown; charset=utf-8");
    }

    /// <summary>
    ///     JSON proof-of-ROI deltas for <paramref name="runId" /> (same numbers as the first-value report and sponsor PDF).
    /// </summary>
    [HttpGet("runs/{runId}/pilot-run-deltas")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(PilotRunDeltasResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPilotRunDeltas(string runId, CancellationToken cancellationToken)
    {
        ArchitectureRunDetail? detail = await runDetailQueryService.GetRunDetailAsync(runId, cancellationToken);

        if (detail is null)
            return this.NotFoundProblem($"Run '{runId}' was not found (or is out of scope).", ProblemTypes.RunNotFound);

        PilotRunDeltas deltas = await pilotRunDeltaComputer.ComputeAsync(detail, cancellationToken);
        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        DateTimeOffset end = TimeProvider.System.GetUtcNow();
        DateTimeOffset start = end.AddDays(-30);
        ValueReportSnapshot snapshot =
            await valueReportBuilder.BuildAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, start, end, cancellationToken);

        DateTime? extractorCollectionTimestampUtc = await TryResolveExtractorCollectionTimestampUtcAsync(
            scope,
            detail.Run.RunId,
            cancellationToken);

        return Ok(PilotRunDeltasResponseMapper.ToResponseWithProofPackage(
            detail.Run,
            detail.Manifest,
            deltas,
            snapshot,
            extractorCollectionTimestampUtc));
    }

    /// <summary>
    ///     Aggregated proof-of-ROI deltas for the most recent committed runs in scope (newest first).
    ///     Powers the operator-shell <c>BeforeAfterDeltaPanel</c> "top" / "sidebar" placements so the panel
    ///     does not have to fan out one HTTP call per run. <paramref name="count" /> is clamped server-side
    ///     to <c>[1, 25]</c> and defaults to <c>5</c>.
    /// </summary>
    [HttpGet("runs/recent-deltas")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(RecentPilotRunDeltasResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<RecentPilotRunDeltasResponse>> GetRecentDeltas(
        [FromQuery(Name = "count")] int? count,
        CancellationToken cancellationToken)
    {
        int requested = count ?? IRecentPilotRunDeltasService.DefaultCount;
        RecentPilotRunDeltasResponse response =
            await recentPilotRunDeltasService.GetRecentDeltasAsync(requested, cancellationToken);

        return Ok(response);
    }

    /// <summary>
    ///     PDF projection of the first-value-report Markdown — a one-shot sponsor email attachment for a committed run.
    ///     Mirrors the auth surface of <see cref="GetFirstValueReport" /> (ReadAuthority) so the operator-shell post-commit
    ///     CTA does not introduce a new commercial gate at the click site.
    /// </summary>
    [HttpPost("runs/{runId}/first-value-report.pdf")]
    [Produces("application/pdf")]
    [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> PostFirstValueReportPdf(string runId, CancellationToken cancellationToken)
    {
        string baseForLinks = $"{Request.Scheme}://{Request.Host.Value}";
        byte[]? pdf = await firstValueReportPdfBuilder.BuildPdfAsync(runId, baseForLinks, cancellationToken);

        return pdf is null
            ? this.NotFoundProblem($"First-value report PDF is not available for run '{runId}'.",
                ProblemTypes.RunNotFound)
            : File(pdf, "application/pdf", $"first-value-report-{runId}.pdf");
    }

    /// <summary>JSON pilot scorecard for the current tenant scope (UTC window).</summary>
    [HttpPost("scorecard")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(PilotScorecardResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> PostScorecard(
        [FromBody] PilotScorecardPostRequest? body,
        CancellationToken cancellationToken)
    {
        DateTimeOffset end = body?.PeriodEnd ?? TimeProvider.System.GetUtcNow();
        DateTimeOffset start = body?.PeriodStart ?? end.AddDays(-30);

        if (end <= start)
            return this.BadRequestProblem("PeriodEnd must be after PeriodStart.", ProblemTypes.ValidationFailed);

        PilotScorecardSummary summary = await pilotScorecardBuilder.BuildAsync(start, end, cancellationToken);

        decimal? hoursSaved = body?.HoursSaved;
        int? risksMitigated = body?.RisksMitigated;
        string? qualitativeNotes = body?.QualitativeNotes?.Trim();

        if (hoursSaved.HasValue || risksMitigated.HasValue || !string.IsNullOrWhiteSpace(qualitativeNotes))
        {
            ScopeContext scope = scopeContextProvider.GetCurrentScope();
            string actor = actorContext.GetActor();
            string payload = JsonSerializer.Serialize(
                new
                {
                    hoursSaved,
                    risksMitigated,
                    qualitativeNotes,
                    periodStart = start,
                    periodEnd = end
                });

            await auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.PilotScorecardValueMetricsSubmitted,
                    ActorUserId = actor,
                    ActorUserName = actor,
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ProjectId = scope.ProjectId,
                    DataJson = payload,
                    CorrelationId = "pilot-scorecard-value-metrics"
                },
                cancellationToken);
        }

        PilotScorecardResponse response = new()
        {
            TenantId = summary.TenantId,
            PeriodStart = summary.PeriodStart,
            PeriodEnd = summary.PeriodEnd,
            RunsInPeriod = summary.RunsInPeriod,
            RunsWithCommittedManifest = summary.RunsWithCommittedManifest,
            ExtractorCollectionTimestampUtc = summary.ExtractorCollectionTimestampUtc,
            HoursSaved = hoursSaved,
            RisksMitigated = risksMitigated,
            QualitativeNotes = qualitativeNotes
        };

        return Ok(response);
    }

    private async Task<DateTime?> TryResolveExtractorCollectionTimestampUtcAsync(
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken)
    {
        if (Guid.TryParse(runId, out Guid runGuid))
        {
            AzureExtractorPackageProvenance? provenance =
                await azureExtractorPackageRepository.TryGetLatestProvenanceByRunIdAsync(scope, runGuid, cancellationToken);

            if (provenance?.CollectionTimestampUtc is not null)
                return provenance.CollectionTimestampUtc;
        }

        return await azureExtractorPackageRepository.TryGetLatestCollectionTimestampUtcInScopeAsync(scope, cancellationToken);
    }

    /// <summary>
    ///     One-page sponsor PDF for a run (Standard tier) — headline timing plus 30-day pilot scorecard mix.
    /// </summary>
    [HttpPost("runs/{runId}/sponsor-one-pager")]
    [RequiresCommercialTenantTier(TenantTier.Standard)]
    [Produces("application/pdf")]
    [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> PostSponsorOnePager(string runId, CancellationToken cancellationToken)
    {
        string baseForLinks = $"{Request.Scheme}://{Request.Host.Value}";
        byte[]? pdf = await sponsorOnePagerPdfBuilder.BuildPdfAsync(runId, baseForLinks, cancellationToken);

        return pdf is null
            ? this.NotFoundProblem($"Sponsor one-pager is not available for run '{runId}'.", ProblemTypes.RunNotFound)
            : File(pdf, "application/pdf", $"sponsor-one-pager-{runId}.pdf");
    }

    /// <summary>Optional structured closeout for sponsor proof-of-ROI (tenant-scoped insert + audit).</summary>
    [HttpPost("closeout")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> PostCloseout(
        [FromBody] PilotCloseoutPostRequest? body,
        CancellationToken cancellationToken)
    {
        if (body is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.ValidationFailed);

        if (body.BaselineHours is < 0)
            return this.BadRequestProblem("BaselineHours cannot be negative.", ProblemTypes.ValidationFailed);

        if (body.SpeedScore is < 1 or > 5 || body.ManifestPackageScore is < 1 or > 5
            || body.TraceabilityScore is < 1 or > 5)
            return this.BadRequestProblem("Scores must be between 1 and 5.", ProblemTypes.ValidationFailed);

        Guid? runGuid = null;

        if (!string.IsNullOrWhiteSpace(body.RunId))
        {
            if (!Guid.TryParse(body.RunId, out Guid parsed))
                return this.BadRequestProblem("RunId must be a GUID string when supplied.", ProblemTypes.ValidationFailed);

            runGuid = parsed;
        }

        string? notes = body.Notes;

        if (notes is not null && notes.Length > 2000)
            notes = notes[..2000];

        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        string actor = actorContext.GetActor();
        Guid closeoutId = Guid.NewGuid();
        DateTimeOffset created = TimeProvider.System.GetUtcNow();

        PilotCloseoutRecord record = new()
        {
            CloseoutId = closeoutId,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            RunId = runGuid,
            BaselineHours = body.BaselineHours,
            SpeedScore = (byte)body.SpeedScore,
            ManifestPackageScore = (byte)body.ManifestPackageScore,
            TraceabilityScore = (byte)body.TraceabilityScore,
            Notes = notes,
            CreatedUtc = created
        };

        await pilotCloseoutRepository.InsertAsync(record, cancellationToken);

        string auditPayload = JsonSerializer.Serialize(
            new
            {
                closeoutId,
                runId = runGuid,
                baselineHours = body.BaselineHours,
                speed = body.SpeedScore,
                manifestPackage = body.ManifestPackageScore,
                traceability = body.TraceabilityScore,
                notesLength = notes?.Length ?? 0
            });

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.PilotCloseoutRecorded,
                ActorUserId = actor,
                ActorUserName = actor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = auditPayload,
                CorrelationId = closeoutId.ToString()
            },
            cancellationToken);

        return StatusCode(StatusCodes.Status201Created, new { closeoutId });
    }
}
