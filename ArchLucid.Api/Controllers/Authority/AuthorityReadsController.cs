using ArchLucid.Api.Contracts;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Routing;
using ArchLucid.Api.Support;
using ArchLucid.Application.Traceability;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Explanation;
using ArchLucid.Contracts.Runs;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Explanation;
using ArchLucid.Core.Pagination;
using ArchLucid.Persistence.Queries;
using ArchLucid.Provenance;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Authority;

/// <summary>
///     Canonical product-facing read API for runs, manifests, and review-trail surfaces under <c>/v1/runs/*</c>.
///     Consolidates overlapping reads previously split across <see cref="AuthorityQueryController" /> and
///     <see cref="RunQueryController" />; legacy <c>/v1/authority/reviews/*</c> routes delegate here.
/// </summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/runs")]
[EnableRateLimiting("fixed")]
[ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status429TooManyRequests)]
public sealed class AuthorityReadsController(
    AuthorityRunReadHandlers readHandlers,
    ITraceabilityBundleExportApplicationService traceabilityBundleExport) : ControllerBase
{
    /// <summary>Lists runs across the current tenant/workspace/project scope (newest first, keyset).</summary>
    [HttpGet("")]
    [ProducesResponseType(typeof(CursorPagedResponse<RunSummaryResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ListRuns(
        [FromQuery] string? cursor = null,
        [FromQuery] int take = RunPagination.DefaultTake,
        [FromQuery] int? page = null,
        [FromQuery] int pageSize = PaginationDefaults.DefaultPageSize,
        CancellationToken ct = default)
    {
        if (page is > 1 && string.IsNullOrWhiteSpace(cursor))
            return this.BadRequestProblem(
                "Paging beyond page 1 requires the nextCursor token from the prior response.",
                ProblemTypes.ValidationFailed);

        DateTime? createdUtc = null;
        Guid? runId = null;

        if (!string.IsNullOrWhiteSpace(cursor))
        {
            (DateTime CreatedUtc, Guid RunId)? decoded = RunCursorCodec.TryDecode(cursor.Trim());

            if (!decoded.HasValue)
                return this.BadRequestProblem("cursor is invalid.", ProblemTypes.ValidationFailed);

            createdUtc = decoded.Value.CreatedUtc;
            runId = decoded.Value.RunId;
        }

        int effectiveTake =
            string.IsNullOrWhiteSpace(cursor) && page.HasValue
                ? RunPagination.ClampTake(pageSize)
                : RunPagination.ClampTake(take);

        (IReadOnlyList<RunSummaryDto> Items, bool HasMore) keysetPage =
            await readHandlers.ListRunsInScopeKeysetAsync(createdUtc, runId, effectiveTake, ct);

        string? nextCursor =
            keysetPage is { HasMore: true, Items.Count: > 0 }
                ? RunCursorCodec.Encode(keysetPage.Items[^1].CreatedUtc, keysetPage.Items[^1].RunId)
                : null;

        IReadOnlyList<RunSummaryResponse> mapped = keysetPage.Items.Select(AuthorityRunReadHandlers.ToRunSummaryResponse).ToList();

        return Ok(
            new CursorPagedResponse<RunSummaryResponse>
            {
                Items = mapped,
                NextCursor = nextCursor,
                HasMore = keysetPage.HasMore,
                RequestedTake = effectiveTake
            });
    }

    /// <summary>Full run detail including hydrated snapshots and golden manifest when available.</summary>
    [HttpGet("{runId:guid}")]
    [ProducesResponseType(typeof(RunDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetRunDetail(Guid runId, CancellationToken ct = default)
    {
        RunDetailDto? detail = await readHandlers.GetRunDetailAsync(runId, ct);

        return detail is null
            ? this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound)
            : Ok(detail);
    }

    /// <summary>Golden (sealed) review record JSON when the run is finalized.</summary>
    [HttpGet("{runId:guid}/manifest")]
    [ProducesResponseType(typeof(ManifestDocument), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetRunManifest(Guid runId, CancellationToken ct = default)
    {
        RunDetailDto? detail = await readHandlers.GetRunDetailAsync(runId, ct);

        if (detail is null)
            return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);

        if (detail.GoldenManifest is null)
            return this.NotFoundProblem(
                $"Golden manifest for run '{runId}' was not found.",
                ProblemTypes.ManifestNotFound);

        await readHandlers.LogRunScopedAuditAsync(
            AuditEventTypes.ManifestViewed,
            runId,
            detail.GoldenManifest.ManifestId,
            ct);

        return Ok(detail.GoldenManifest);
    }

    /// <summary>Audit events associated with this run, oldest-first (pipeline / lifecycle visibility).</summary>
    [HttpGet("{runId:guid}/review-trail")]
    [ProducesResponseType(typeof(IReadOnlyList<RunPipelineTimelineItemResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetReviewTrail(Guid runId, CancellationToken ct = default)
    {
        IReadOnlyList<RunPipelineTimelineItemResponse>? body =
            await readHandlers.TryGetPipelineTimelineAsync(runId, ct);

        if (body is null)
            return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);

        await readHandlers.LogRunScopedAuditAsync(AuditEventTypes.ReviewTrailAccessed, runId, null, ct);

        return Ok(body);
    }

    /// <summary>Unified decision rationale (authority or coordinator) for operator triage.</summary>
    [HttpGet("{runId:guid}/review-trail/rationale")]
    [ProducesResponseType(typeof(RunRationale), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetReviewTrailRationale(Guid runId, CancellationToken ct = default)
    {
        RunRationale? rationale = await readHandlers.GetRunRationaleAsync(runId, ct);

        return rationale is null
            ? this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound)
            : Ok(rationale);
    }

    /// <summary>
    ///     Decision provenance graph (nodes + edges) linking graph, findings, rules, decisions, manifest, and artifacts.
    /// </summary>
    [HttpGet("{runId:guid}/review-trail/provenance")]
    [ProducesResponseType(typeof(DecisionProvenanceGraph), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> GetReviewTrailProvenance(Guid runId, CancellationToken ct = default)
    {
        (DecisionProvenanceGraph? graph, RunDetailDto? detail, string? unprocessableDetail) =
            await readHandlers.TryGetProvenanceGraphAsync(runId, ct);

        if (detail is null && graph is null && unprocessableDetail is null)
            return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);

        if (unprocessableDetail is not null)
            return this.UnprocessableEntityProblem(unprocessableDetail);

        if (graph is null)
            return this.UnprocessableEntityProblem("Provenance graph could not be resolved for this run.");

        await readHandlers.LogRunScopedAuditAsync(AuditEventTypes.ProvenanceAccessed, runId, null, ct);

        return Ok(graph);
    }

    /// <summary>ZIP bundle: run summary, audit slice for the run, and decision traces (size-capped).</summary>
    [HttpGet("{runId:guid}/review-trail/export")]
    [Produces("application/zip")]
    [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status413PayloadTooLarge)]
    public async Task<IActionResult> GetReviewTrailExport(Guid runId, CancellationToken ct = default)
    {
        string runIdText = runId.ToString("D");
        TraceabilityBundleExportResult result = await traceabilityBundleExport.TryBuildZipAsync(
            runIdText,
            HttpContext.TraceIdentifier,
            ct);

        return result.Outcome switch
        {
            TraceabilityBundleExportOutcome.RunNotFound => this.NotFoundProblem(
                $"Run '{runIdText}' was not found.",
                ProblemTypes.RunNotFound),
            TraceabilityBundleExportOutcome.TooLarge => this.PayloadTooLargeProblem(
                result.ErrorMessage!,
                ProblemTypes.ExportFailed,
                extensions: new Dictionary<string, object?>
                {
                    ["attemptedBytes"] = result.AttemptedBytes,
                    ["maxBytes"] = result.MaxBytes,
                }),
            TraceabilityBundleExportOutcome.Success => File(
                result.ZipBytes!,
                "application/zip",
                $"traceability-{runIdText}.zip"),
            _ => throw new InvalidOperationException($"Unexpected outcome {result.Outcome}."),
        };
    }
}
