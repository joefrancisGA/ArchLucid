using System.Text.Json;

using ArchLucid.Api.Http;
using ArchLucid.Api.Models;
using ArchLucid.Api.Models.Graph;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Services.Authority;
using ArchLucid.Application.Runs.Query;
using ArchLucid.Application.Traceability;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Explanation;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.DevTesting;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Persistence.Serialization;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Authority;

/// <summary>
///     Read-only HTTP API for architecture runs: detail, provenance, decisions, evidence, traces, and list.
/// </summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/architecture")]
[EnableRateLimiting("fixed")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
[ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status429TooManyRequests)]
public sealed class RunQueryController(
    IRunGraphQueryService runGraphQueryService,
    IRunFindingsQueryService runFindingsQueryService,
    IRunProvenanceQueryService runProvenanceQueryService,
    ITraceabilityBundleExportApplicationService traceabilityBundleExport) : ControllerBase
{
    /// <summary>
    ///     Returns the canonical run aggregate (tasks, results, manifest, decision traces) for <paramref name="runId" />.
    /// </summary>
    [HttpGet("review/{runId}")]
    [ProducesResponseType(typeof(RunDetailsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status304NotModified)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetRun(
        [FromRoute] string runId,
        CancellationToken cancellationToken)
    {
        RunGraphDetailQueryResult result = await runGraphQueryService.GetRunDetailAsync(runId, cancellationToken);

        return result.Outcome switch
        {
            RunGraphQueryOutcome.Success => this.OkWithConditionalEtag(result.Response!, result.Etag!),
            RunGraphQueryOutcome.ManifestNotFound => this.NotFoundProblem(result.ProblemDetail!, ProblemTypes.ResourceNotFound),
            _ => this.NotFoundProblem(result.ProblemDetail!, ProblemTypes.RunNotFound)
        };
    }

    /// <summary>Directional analyst-hour estimate for packaging work implied by this run (configured multipliers).</summary>
    [HttpGet("review/{runId}/roi")]
    [ProducesResponseType(typeof(RunRoiScorecardDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetRunRoiEstimate(
        [FromRoute] string runId,
        CancellationToken cancellationToken)
    {
        RunRoiEstimateQueryResult result = await runGraphQueryService.GetRunRoiEstimateAsync(runId, cancellationToken);

        return result.Outcome == RunGraphQueryOutcome.Success
            ? Ok(result.Estimate)
            : this.NotFoundProblem(result.ProblemDetail!, ProblemTypes.RunNotFound);
    }

    /// <summary>Authority pipeline stage start/end outcomes for operator run investigation (TB-250).</summary>
    [HttpGet("review/{runId}/stage-timeline")]
    [ProducesResponseType(typeof(IReadOnlyList<StageTimelineSummary>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetRunStageTimeline(
        [FromRoute] string runId,
        CancellationToken cancellationToken)
    {
        RunStageTimelineQueryResult result =
            await runGraphQueryService.GetRunStageTimelineAsync(runId, cancellationToken);

        return result.Outcome switch
        {
            RunGraphQueryOutcome.Success => Ok(result.Timeline),
            RunGraphQueryOutcome.BadRequest => this.BadRequestProblem(result.ProblemDetail!, ProblemTypes.ValidationFailed),
            _ => this.NotFoundProblem(result.ProblemDetail!, ProblemTypes.RunNotFound)
        };
    }

    /// <summary>Keyset list of relational finding metadata for <paramref name="runId" />.</summary>
    [HttpGet("review/{runId}/findings")]
    [HttpGet("/v{version:apiVersion}/runs/{runId}/findings")]
    [ProducesResponseType(typeof(RunFindingsListResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status304NotModified)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ListRunFindings(
        [FromRoute] string runId,
        [FromQuery] string? orderBy,
        [FromQuery] int? take,
        [FromQuery] int? cursorSortOrder,
        [FromQuery] int? cursorPriorityRank,
        [FromQuery] Guid? cursorFindingRecordId,
        CancellationToken cancellationToken)
    {
        RunFindingsListQueryResult result = await runFindingsQueryService.ListRunFindingsAsync(
            runId,
            orderBy,
            take,
            cursorSortOrder,
            cursorPriorityRank,
            cursorFindingRecordId,
            cancellationToken);

        if (result.Outcome == RunFindingsQueryOutcome.BadRequest)
            return this.BadRequestProblem(result.ProblemDetail!, ProblemTypes.ValidationFailed);

        if (result.Outcome != RunFindingsQueryOutcome.Success)
            return this.NotFoundProblem(result.ProblemDetail!, ProblemTypes.ResourceNotFound);

        IActionResult? findingsNotModified = this.TryConditionalNotModified(result.Etag!);

        return findingsNotModified ?? this.OkWithConditionalEtag(result.Response!, result.Etag!);
    }

    /// <summary>
    ///     Bulk export of flattened architecture findings for <paramref name="runId" /> as <c>text/csv</c> (one row per
    ///     finding across agent results).
    /// </summary>
    [HttpGet("review/{runId}/findings/export/csv")]
    [Produces("text/csv")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ExportRunFindingsCsv(
        [FromRoute] string runId,
        [FromServices] IAuditService auditService,
        CancellationToken cancellationToken)
    {
        RunFindingsCsvExportQueryResult result =
            await runFindingsQueryService.ExportRunFindingsCsvAsync(runId, cancellationToken);

        return result.Outcome switch
        {
            RunFindingsQueryOutcome.ManifestNotFound => this.NotFoundProblem(result.ProblemDetail!, ProblemTypes.ResourceNotFound),
            RunFindingsQueryOutcome.NotFound => this.NotFoundProblem(result.ProblemDetail!, ProblemTypes.RunNotFound),
            _ => await ExportFindingsCsvSuccessAsync(result, auditService, cancellationToken)
        };
    }

    /// <summary>Knowledge-graph snapshot packaged for interactive Cytoscape.js renders.</summary>
    [HttpGet("reviews/{runId}/graph/interactive")]
    [HttpGet("reviews/{runId}/graph/cytoscape")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(CytoscapeInteractiveGraphResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetInteractiveGraphSnapshot(
        [FromRoute] string runId,
        CancellationToken cancellationToken)
    {
        RunInteractiveGraphQueryResult result =
            await runGraphQueryService.GetInteractiveGraphSnapshotAsync(runId, cancellationToken);

        return result.Outcome switch
        {
            RunGraphQueryOutcome.Success => Ok(result.Response),
            RunGraphQueryOutcome.BadRequest => this.BadRequestProblem(result.ProblemDetail!, ProblemTypes.ValidationFailed),
            _ => this.NotFoundProblem(result.ProblemDetail!, ProblemTypes.RunNotFound)
        };
    }

    /// <summary>Aggregates ROI telemetry across all runs in the current scope.</summary>
    [HttpGet("telemetry/roi")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRoiTelemetry(CancellationToken cancellationToken)
    {
        RunRoiTelemetryQueryResult result = await runGraphQueryService.GetRoiTelemetryAsync(cancellationToken);
        return Ok(result.Aggregate);
    }

    /// <summary>
    ///     Returns the coordinator linkage graph (request, tasks, results, findings, manifest, traces, decisions) and a sorted
    ///     trace timeline.
    /// </summary>
    [HttpGet("reviews/{runId}/provenance")]
    [ProducesResponseType(typeof(ArchitectureRunProvenanceGraph), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetArchitectureRunProvenance(
        [FromRoute] string runId,
        CancellationToken cancellationToken)
    {
        ArchitectureRunProvenanceGraph? graph =
            await runProvenanceQueryService.GetProvenanceAsync(runId, cancellationToken);

        return graph is null
            ? this.NotFoundProblem(
                $"Run '{runId}' was not found, or its manifest reference is broken.",
                ProblemTypes.RunNotFound)
            : Ok(graph);
    }

    /// <summary>
    ///     Per-node provenance explanations are not a supported surface (no stable per-node LLM contract). This route is
    ///     omitted from OpenAPI; callers should use <c>GET /v1/explain/runs/{{runId}}/aggregate</c>. Tenant scope is enforced
    ///     before the response.
    /// </summary>
    [ApiExplorerSettings(IgnoreApi = true)]
    [HttpGet("reviews/{runId}/provenance/{nodeId}/explanation")]
    [HttpGet("review/{runId}/provenance/{nodeId}/explanation")]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status501NotImplemented)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetProvenanceNodeExplanation(
        [FromRoute] string runId,
        [FromRoute] string nodeId,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(runId) || string.IsNullOrWhiteSpace(nodeId))
            return this.BadRequestProblem("Run id and node id are required.", ProblemTypes.ValidationFailed);

        if (!await runProvenanceQueryService.AuthorityRunExistsInScopeAsync(runId, cancellationToken))
            return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);

        ProvenanceNodeExplanationQueryResult unsupported =
            runProvenanceQueryService.GetProvenanceNodeExplanationNotSupported();

        return this.NotImplementedProblem(
            unsupported.Detail,
            ProblemTypes.ProvenanceNodeExplanationNotSupported,
            "Provenance node explanation not supported",
            unsupported.Hints);
    }

    /// <summary>
    ///     Returns decision-tree nodes materialized for <paramref name="runId" /> after commit (empty before commit yields
    ///     404).
    /// </summary>
    [HttpGet("review/{runId}/decisions")]
    [ProducesResponseType(typeof(DecisionNodeResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetRunDecisions(
        [FromRoute] string runId,
        CancellationToken cancellationToken)
    {
        RunDecisionsQueryResult result =
            await runProvenanceQueryService.GetRunDecisionsAsync(runId, cancellationToken);

        return result.Outcome == RunGraphQueryOutcome.Success
            ? Ok(result.Response)
            : this.NotFoundProblem(result.ProblemDetail!, ProblemTypes.ResourceNotFound);
    }

    /// <summary>
    ///     Returns the hydrated <see cref="AgentEvidencePackage" /> used when agents ran for <paramref name="runId" />.
    /// </summary>
    [HttpGet("review/{runId}/evidence")]
    [ProducesResponseType(typeof(AgentEvidencePackageResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetRunEvidence(
        [FromRoute] string runId,
        CancellationToken cancellationToken)
    {
        RunEvidenceQueryResult result =
            await runProvenanceQueryService.GetRunEvidenceAsync(runId, cancellationToken);

        return result.Outcome == RunGraphQueryOutcome.Success
            ? Ok(result.Response)
            : this.NotFoundProblem(result.ProblemDetail!, ProblemTypes.ResourceNotFound);
    }

    /// <summary>
    ///     Returns a page of <see cref="AgentExecutionTraceSummary" /> rows for <paramref name="runId" /> (no prompts or
    ///     raw model output — use <c>GET /v1/internal/architecture/traces/forensics/{traceId}</c> for full TraceJson).
    /// </summary>
    [HttpGet("review/{runId}/traces")]
    [ProducesResponseType(typeof(AgentExecutionTraceResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetRunTraces(
        [FromRoute] string runId,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        RunTracesQueryResult result =
            await runProvenanceQueryService.GetRunTracesAsync(runId, pageNumber, pageSize, cancellationToken);

        return result.Outcome switch
        {
            RunGraphQueryOutcome.Success => Ok(result.Response),
            RunGraphQueryOutcome.BadRequest => this.BadRequestProblem(result.ProblemDetail!, ProblemTypes.ValidationFailed),
            _ => this.NotFoundProblem(result.ProblemDetail!, ProblemTypes.RunNotFound)
        };
    }

    /// <summary>
    ///     Trace-derived redacted invocation forensics for operator review (TB-110). Not a structured MCP tool-call ledger.
    /// </summary>
    [HttpGet("review/{runId}/tool-invocation-forensics")]
    [Authorize(Policy = ArchLucidPolicies.RequireOperatorRole)]
    [ProducesResponseType(typeof(RunToolInvocationForensicsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetRunToolInvocationForensics(
        [FromRoute] string runId,
        CancellationToken cancellationToken = default)
    {
        RunToolInvocationForensicsQueryResult result =
            await runProvenanceQueryService.GetRunToolInvocationForensicsAsync(runId, cancellationToken);

        return result.Outcome == RunGraphQueryOutcome.Success
            ? Ok(result.Response)
            : this.NotFoundProblem(result.ProblemDetail!, ProblemTypes.RunNotFound);
    }

    /// <summary>
    ///     Lists runs visible in the current scope. Without <paramref name="cursor" />, uses offset pagination via
    ///     <paramref name="limit" /> and <paramref name="offset" />; with <paramref name="cursor" />, uses keyset
    ///     continuation. Product clients may prefer <c>GET /v1/runs</c> (<see cref="AuthorityReadsController.ListRuns" />).
    /// </summary>
    [HttpGet("reviews")]
    [ProducesResponseType(typeof(CursorPagedResponse<RunListItemResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status304NotModified)]
    public Task<IActionResult> ListRuns(
        [FromQuery] string? cursor = null,
        [FromQuery] int? limit = null,
        [FromQuery] int offset = 0,
        [FromQuery] int take = RunPagination.DefaultTake,
        [FromQuery] int page = PaginationDefaults.DefaultPage,
        [FromQuery] int pageSize = PaginationDefaults.DefaultPageSize,
        CancellationToken cancellationToken = default) =>
        ListRunsCore(cursor, limit, offset, take, page, pageSize, cancellationToken);

    /// <summary>Legacy alias for <see cref="ListRuns" />.</summary>
    [Obsolete("Prefer GET /v1/architecture/reviews or GET /v1/runs. Retained for backward compatibility.")]
    [HttpGet("runs")]
    [ProducesResponseType(typeof(CursorPagedResponse<RunListItemResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status304NotModified)]
    public Task<IActionResult> ListRunsLegacyAlias(
        [FromQuery] string? cursor = null,
        [FromQuery] int? limit = null,
        [FromQuery] int offset = 0,
        [FromQuery] int take = RunPagination.DefaultTake,
        [FromQuery] int page = PaginationDefaults.DefaultPage,
        [FromQuery] int pageSize = PaginationDefaults.DefaultPageSize,
        CancellationToken cancellationToken = default) =>
        ListRunsCore(cursor, limit, offset, take, page, pageSize, cancellationToken);

    private async Task<IActionResult> ListRunsCore(
        string? cursor,
        int? limit,
        int offset,
        int take,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        RunListQueryResult result = await runGraphQueryService.ListRunsAsync(
            cursor,
            limit,
            offset,
            take,
            page,
            pageSize,
            cancellationToken);

        return this.OkWithConditionalEtag(result.Body, result.Etag);
    }

    /// <summary>
    ///     Returns persisted artifact pointers for one finding (manifest snapshot ids, graph nodes, agent trace ids).
    /// </summary>
    [HttpGet("review/{runId}/findings/{findingId}/evidence-chain")]
    [ProducesResponseType(typeof(FindingEvidenceChainResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetFindingEvidenceChain(
        [FromRoute] string runId,
        [FromRoute] string findingId,
        CancellationToken cancellationToken)
    {
        FindingEvidenceChainQueryResult result =
            await runFindingsQueryService.GetFindingEvidenceChainAsync(runId, findingId, cancellationToken);

        return result.Outcome == RunFindingsQueryOutcome.Success
            ? Ok(result.Chain)
            : this.NotFoundProblem(result.ProblemDetail!, ProblemTypes.ResourceNotFound);
    }

    /// <summary>
    ///     Same payload as <c>GET /v1/findings/{findingId}/inspect</c>; returns <c>404</c> when the finding&apos;s persisted
    ///     run identifier does not match <paramref name="runId" /> (prevents cross-run ambiguity in deep links).
    /// </summary>
    [HttpGet("review/{runId}/findings/{findingId}/inspect")]
    [ProducesResponseType(typeof(FindingInspectResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetFindingInspectForRun(
        [FromRoute] string runId,
        [FromRoute] string findingId,
        [FromQuery] bool includeTypedPayload = true,
        CancellationToken cancellationToken = default)
    {
        FindingInspectQueryResult result = await runFindingsQueryService.GetFindingInspectForRunAsync(
            runId,
            findingId,
            includeTypedPayload,
            cancellationToken);

        return result.Outcome switch
        {
            RunFindingsQueryOutcome.Success => Ok(result.Response),
            RunFindingsQueryOutcome.BadRequest => this.BadRequestProblem(result.ProblemDetail!, ProblemTypes.ValidationFailed),
            _ => this.NotFoundProblem(result.ProblemDetail!, ProblemTypes.ResourceNotFound)
        };
    }

    /// <summary>ZIP bundle: run summary, audit slice for the run, and decision traces (size-capped).</summary>
    [HttpGet("review/{runId}/review-trail/export")]
    [Produces("application/zip")]
    [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status413PayloadTooLarge)]
    public Task<IActionResult> GetTraceabilityBundleZip(
        [FromRoute] string runId,
        CancellationToken cancellationToken) =>
        GetTraceabilityBundleZipCore(runId, cancellationToken);

    /// <summary>Legacy alias; prefer <c>GET /v1/runs/{runId}/review-trail/export</c>.</summary>
    [Obsolete("Prefer GET /v1/runs/{runId}/review-trail/export. Retained for backward compatibility.")]
    [HttpGet("review/{runId}/traceability-bundle.zip")]
    [Produces("application/zip")]
    [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status413PayloadTooLarge)]
    public Task<IActionResult> GetTraceabilityBundleZipLegacyAlias(
        [FromRoute] string runId,
        CancellationToken cancellationToken) =>
        GetTraceabilityBundleZipCore(runId, cancellationToken);

    private async Task<IActionResult> GetTraceabilityBundleZipCore(
        string runId,
        CancellationToken cancellationToken)
    {
        TraceabilityBundleExportResult result = await traceabilityBundleExport.TryBuildZipAsync(
            runId,
            HttpContext.TraceIdentifier,
            cancellationToken);

        return result.Outcome switch
        {
            TraceabilityBundleExportOutcome.RunNotFound => this.NotFoundProblem(
                $"Run '{runId}' was not found.",
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
                $"traceability-{runId}.zip"),
            _ => throw new InvalidOperationException($"Unexpected outcome {result.Outcome}."),
        };
    }

    private async Task<IActionResult> ExportFindingsCsvSuccessAsync(
        RunFindingsCsvExportQueryResult result,
        IAuditService auditService,
        CancellationToken cancellationToken)
    {
        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.FindingsListAccessed,
                RunId = result.AuditRunId,
                DataJson = JsonSerializer.Serialize(
                    new { format = "csv", findingCount = result.FindingCount },
                    AuditJsonSerializationOptions.Instance),
            },
            cancellationToken);

        return File(
            result.CsvBytes!,
            "text/csv; charset=utf-8",
            result.DownloadName!);
    }
}
