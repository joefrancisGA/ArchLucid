using System.Globalization;
using System.IO;
using System.Text;
using System.Text.Json;

using ArchLucid.Api.Mapping;
using ArchLucid.Api.Models;
using ArchLucid.Api.Models.Graph;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Support;
using ArchLucid.Application;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Explanation;
using ArchLucid.Application.Findings;
using ArchLucid.Application.Reporting;
using ArchLucid.Application.Traceability;
using ArchLucid.Application.Trust;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Persistence.Decisions;
using ArchLucid.Contracts.Explanation;
using ArchLucid.Contracts.Findings;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Queries;
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
    IRunDetailQueryService runDetailQueryService,
    IRunRoiEstimator runRoiEstimator,
    IArchitectureRunProvenanceService architectureRunProvenanceService,
    IRunRepository authorityRunRepository,
    IDecisionNodeRepository decisionNodeRepository,
    IAgentEvidencePackageRepository agentEvidencePackageRepository,
    IAgentExecutionTraceRepository agentExecutionTraceRepository,
    IFindingEvidenceChainService findingEvidenceChainService,
    IFindingInspectReadRepository findingInspectReadRepository,
    IReasoningSummaryBuilder reasoningSummaryBuilder,
    IScopeContextProvider scopeContextProvider,
    ITraceabilityBundleBuilder traceabilityBundleBuilder,
    IRunTrustEvidenceCardBuilder trustEvidenceCardBuilder,
    ILlmCostEstimator llmCostEstimator,
    IAuthorityQueryService authorityQueryService,
    IConfiguration configuration,
    IAuditService auditService,
    ExportFormatterService exportFormatter,
    IFindingsSnapshotRepository findingsSnapshotRepository) : ControllerBase
{
    /// <summary>
    ///     Returns the canonical run aggregate (tasks, results, manifest, decision traces) for <paramref name="runId" />.
    /// </summary>
    [HttpGet("run/{runId}")]
    [HttpGet("/v{version:apiVersion}/runs/{runId}")]
    [ProducesResponseType(typeof(RunDetailsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetRun(
        [FromRoute] string runId,
        CancellationToken cancellationToken)
    {
        ArchitectureRunDetail? detail = await runDetailQueryService.GetRunDetailAsync(runId, cancellationToken);

        if (detail is null)
            return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);

        if (!string.IsNullOrWhiteSpace(detail.Run.CurrentManifestVersion) && detail.Manifest is null)
            return this.NotFoundProblem(
                $"Manifest referenced by run '{runId}' could not be found.",
                ProblemTypes.ResourceNotFound);

        RunDetailsResponse response = RunResponseMapper.ToRunDetailsResponse(
            detail.Run,
            detail.Tasks,
            detail.Results,
            detail.Manifest,
            detail.DecisionTraces);

        response.ExecutionFlavorBuyerSummary = RunExecutionFlavorSummary.Build(
            detail.Run,
            configuration["AgentExecution:Mode"]);

        if (detail.IsCommitted)
        {
            response.TrustEvidenceCard = await trustEvidenceCardBuilder.BuildAsync(
                detail,
                configuration["AgentExecution:Mode"],
                cancellationToken);
        }

        await RunAgentExecutionLlmCostEstimateAppender.AppendAsync(
            response,
            runId,
            agentExecutionTraceRepository,
            llmCostEstimator,
            cancellationToken);

        return Ok(response);
    }

    /// <summary>Directional analyst-hour estimate for packaging work implied by this run (configured multipliers).</summary>
    [HttpGet("run/{runId}/roi")]
    [ProducesResponseType(typeof(RunRoiScorecardDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetRunRoiEstimate(
        [FromRoute] string runId,
        CancellationToken cancellationToken)
    {
        ArchitectureRunDetail? detail = await runDetailQueryService.GetRunDetailAsync(runId, cancellationToken);

        if (detail is null)
            return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);

        RunRoiScorecardDto estimate = runRoiEstimator.Estimate(detail);

        return Ok(estimate);
    }

    /// <summary>Keyset list of relational finding metadata for <paramref name="runId" />.</summary>
    [HttpGet("run/{runId}/findings")]
    [ProducesResponseType(typeof(RunFindingsListResponse), StatusCodes.Status200OK)]
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
        if (string.IsNullOrWhiteSpace(runId))
            return this.BadRequestProblem("runId is required.", ProblemTypes.ValidationFailed);

        if (!TryParseRunId(runId, out Guid runGuid))
            return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);

        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        Persistence.Models.RunRecord? run = await authorityRunRepository.GetByIdAsync(scope, runGuid, cancellationToken);

        if (run?.FindingsSnapshotId is not Guid snapshotId)
            return this.NotFoundProblem($"Run '{runId}' has no findings snapshot.", ProblemTypes.ResourceNotFound);

        bool orderByPriority = string.Equals(orderBy, "priority", StringComparison.OrdinalIgnoreCase);
        int pageTake = take ?? FindingPagination.DefaultTake;

        FindingRecordMetadataPage page = await findingsSnapshotRepository.ListFindingRecordsKeysetAsync(
            snapshotId,
            cursorSortOrder,
            cursorFindingRecordId,
            cursorPriorityRank,
            severity: null,
            category: null,
            findingType: null,
            pageTake,
            orderByPriority,
            cancellationToken);

        RunFindingListItem[] items = page.Items
            .Select(static row => new RunFindingListItem
            {
                FindingRecordId = row.FindingRecordId,
                FindingId = row.FindingId,
                Severity = row.Severity,
                Category = row.Category,
                FindingType = row.FindingType,
                Title = row.Title,
                SortOrder = row.SortOrder,
                PriorityRank = row.PriorityRank
            })
            .ToArray();

        RunFindingsListResponse body = new()
        {
            RunId = runId.Trim(),
            OrderBy = orderByPriority ? "priority" : "sortOrder",
            Items = items,
            HasMore = page.HasMore
        };

        if (page.HasMore && items.Length > 0)
        {
            RunFindingListItem last = items[^1];
            body.NextCursorSortOrder = last.SortOrder;
            body.NextCursorPriorityRank = last.PriorityRank;
            body.NextCursorFindingRecordId = last.FindingRecordId;
        }

        return Ok(body);
    }

    /// <summary>
    ///     Bulk export of flattened architecture findings for <paramref name="runId" /> as <c>text/csv</c> (one row per
    ///     finding across agent results).
    /// </summary>
    [HttpGet("run/{runId}/findings/export/csv")]
    [Produces("text/csv")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ExportRunFindingsCsv(
        [FromRoute] string runId,
        CancellationToken cancellationToken)
    {
        ArchitectureRunDetail? detail = await runDetailQueryService.GetRunDetailAsync(runId, cancellationToken);

        if (detail is null)
            return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);

        if (!string.IsNullOrWhiteSpace(detail.Run.CurrentManifestVersion) && detail.Manifest is null)
            return this.NotFoundProblem(
                $"Manifest referenced by run '{runId}' could not be found.",
                ProblemTypes.ResourceNotFound);

        string csv = ArchitectureRunFindingsCsvFormatter.BuildCsvContent(detail);
        int findingCount = ArchitectureRunFindingsCsvFormatter.CountFindingsInDetail(detail);

        Guid? auditRunId = TryParseRunId(runId, out Guid runGuidForAudit) ? runGuidForAudit : null;

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.FindingsListAccessed,
                RunId = auditRunId,
                DataJson = JsonSerializer.Serialize(
                    new { format = "csv", findingCount },
                    AuditJsonSerializationOptions.Instance),
            },
            cancellationToken);

        DateTime utcStamp = TimeProvider.System.GetUtcNow().UtcDateTime;
        string timeSegment = exportFormatter.FormatAttachmentSegmentUtc(utcStamp);
        string safeRunStem = auditRunId.HasValue
            ? runGuidForAudit.ToString("N", CultureInfo.InvariantCulture)
            : SanitizeRunIdForFindingExport(runId);

        string downloadName =
            $"architecture-run-{safeRunStem}-findings-{timeSegment}.csv";

        return File(
            Encoding.UTF8.GetBytes(csv),
            "text/csv; charset=utf-8",
            downloadName);
    }

    /// <summary>Knowledge-graph snapshot packaged for interactive Cytoscape.js renders.</summary>
    [HttpGet("runs/{runId}/graph/interactive")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(CytoscapeInteractiveGraphResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetInteractiveGraphSnapshot(
        [FromRoute] string runId,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(runId))
            return this.BadRequestProblem("Run id is required.", ProblemTypes.ValidationFailed);

        if (!TryParseRunId(runId, out Guid runGuid))
            return this.BadRequestProblem("Run id must be a valid GUID.", ProblemTypes.ValidationFailed);

        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        RunDetailDto? detail = await authorityQueryService.GetRunDetailAsync(scope, runGuid, cancellationToken);

        if (detail?.GraphSnapshot is null)
            return this.NotFoundProblem(
                $"Interactive graph snapshot for run '{runGuid:D}' was not found.",
                ProblemTypes.RunNotFound);

        return Ok(GraphSnapshotCytoscapeMapper.ToInteractiveResponse(detail.GraphSnapshot));
    }

    /// <summary>Aggregates ROI telemetry across all runs in the current scope.</summary>
    [HttpGet("telemetry/roi")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRoiTelemetry(
        [FromServices] IDbConnectionFactory db,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = scopeContextProvider.GetCurrentScope();

        using System.Data.IDbConnection connection = await db.CreateOpenConnectionAsync(cancellationToken);

        ArgumentNullException.ThrowIfNull(connection);

        const string sql = @"
            SELECT 
                COUNT(*) as TotalRuns,
                SUM(EstimatedHoursSaved) as TotalHoursSaved,
                AVG(RequestDurationMs + AgentExecutionDurationMs + ManualReviewDurationMs) as AverageTimeToCommitMs
            FROM dbo.RunTelemetry t
            INNER JOIN dbo.Runs r ON t.RunId = r.RunId
            WHERE r.TenantId = @TenantId AND r.WorkspaceId = @WorkspaceId AND r.ProjectId = @ProjectId";

        RunRoiTelemetryRow? aggregateRow =
            await Dapper.SqlMapper.QueryFirstOrDefaultAsync<RunRoiTelemetryRow>(
                connection,
                sql,
                new
                {
                    scope.TenantId,
                    scope.WorkspaceId,
                    scope.ProjectId
                });

        long totalRuns = aggregateRow?.TotalRuns ?? 0L;
        decimal totalHoursSaved = aggregateRow?.TotalHoursSaved ?? 0m;
        long averageTimeToCommitMs = aggregateRow?.AverageTimeToCommitMs is { } avgMs
            ? (long)Math.Round(avgMs, MidpointRounding.AwayFromZero)
            : 0L;

        return Ok(new
        {
            TotalRuns = totalRuns,
            TotalHoursSaved = totalHoursSaved,
            AverageTimeToCommitMs = averageTimeToCommitMs
        });
    }

    /// <summary>
    ///     Returns the coordinator linkage graph (request, tasks, results, findings, manifest, traces, decisions) and a sorted
    ///     trace timeline.
    /// </summary>
    [HttpGet("runs/{runId}/provenance")]
    [ProducesResponseType(typeof(ArchitectureRunProvenanceGraph), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetArchitectureRunProvenance(
        [FromRoute] string runId,
        CancellationToken cancellationToken)
    {
        ArchitectureRunProvenanceGraph? graph = await architectureRunProvenanceService
            .GetProvenanceAsync(runId, cancellationToken);

        if (graph is null)
            return this.NotFoundProblem(
                $"Run '{runId}' was not found, or its manifest reference is broken.",
                ProblemTypes.RunNotFound);

        return Ok(graph);
    }

    /// <summary>
    ///     Per-node provenance explanations are not a supported surface (no stable per-node LLM contract). This route is
    ///     omitted from OpenAPI; callers should use <c>GET /v1/explain/runs/{{runId}}/aggregate</c>. Tenant scope is enforced
    ///     before the response.
    /// </summary>
    [ApiExplorerSettings(IgnoreApi = true)]
    [HttpGet("runs/{runId}/provenance/{nodeId}/explanation")]
    [HttpGet("run/{runId}/provenance/{nodeId}/explanation")]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status501NotImplemented)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetProvenanceNodeExplanation(
        [FromRoute] string runId,
        [FromRoute] string nodeId,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(runId) || string.IsNullOrWhiteSpace(nodeId))
            return this.BadRequestProblem("Run id and node id are required.", ProblemTypes.ValidationFailed);

        if (!await AuthorityRunExistsInScopeAsync(runId, cancellationToken))
            return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);

        const string detail =
            "ArchLucid does not provide per-node provenance explanations. "
            + "Use GET /v1/explain/runs/{runId}/aggregate for the supported run-level RunExplanationSummary "
            + "(Standard commercial tier and ReadAuthority scope, same as other routes under /v1/explain). "
            + "Alternatively, GET /v1/explain/runs/{runId}/explain returns the granular ExplanationResult when licensed.";

        IReadOnlyDictionary<string, object?> hints = new Dictionary<string, object?>(
            StringComparer.Ordinal)
        {
            ["aggregateExplanationPathTemplate"] = "/v1/explain/runs/{runId}/aggregate",
            ["granularExplanationPathTemplate"] = "/v1/explain/runs/{runId}/explain",
        };

        return this.NotImplementedProblem(
            detail,
            ProblemTypes.ProvenanceNodeExplanationNotSupported,
            "Provenance node explanation not supported",
            hints);
    }

    /// <summary>
    ///     Returns decision-tree nodes materialized for <paramref name="runId" /> after commit (empty before commit yields
    ///     404).
    /// </summary>
    [HttpGet("run/{runId}/decisions")]
    [ProducesResponseType(typeof(DecisionNodeResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetRunDecisions(
        [FromRoute] string runId,
        CancellationToken cancellationToken)
    {
        if (!await AuthorityRunExistsInScopeAsync(runId, cancellationToken))
            return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);

        IReadOnlyList<DecisionNodeRecord> decisions = await decisionNodeRepository.GetByRunIdAsync(runId, cancellationToken);

        if (decisions.Count == 0)
            return this.NotFoundProblem(
                $"No decisions found for run '{runId}'. Decisions are available after the run has been committed.",
                ProblemTypes.ResourceNotFound);

        return Ok(new DecisionNodeResponse { Decisions = decisions.ToList() });
    }

    /// <summary>
    ///     Returns the hydrated <see cref="AgentEvidencePackage" /> used when agents ran for <paramref name="runId" />.
    /// </summary>
    [HttpGet("run/{runId}/evidence")]
    [ProducesResponseType(typeof(AgentEvidencePackageResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetRunEvidence(
        [FromRoute] string runId,
        CancellationToken cancellationToken)
    {
        if (!await AuthorityRunExistsInScopeAsync(runId, cancellationToken))
            return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);

        AgentEvidencePackage? evidence = await agentEvidencePackageRepository.GetByRunIdAsync(runId, cancellationToken);
        return evidence is null
            ? this.NotFoundProblem($"Evidence for run '{runId}' was not found.", ProblemTypes.ResourceNotFound)
            : Ok(new AgentEvidencePackageResponse { Evidence = evidence });
    }

    /// <summary>
    ///     Returns a page of <see cref="AgentExecutionTrace" /> rows for <paramref name="runId" /> (including prompts and
    ///     raw model output when persisted).
    /// </summary>
    [HttpGet("run/{runId}/traces")]
    [ProducesResponseType(typeof(AgentExecutionTraceResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetRunTraces(
        [FromRoute] string runId,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        if (pageNumber < 1)
            return this.BadRequestProblem("pageNumber must be at least 1.", ProblemTypes.ValidationFailed);

        if (pageSize is < 1 or > PagingParameters.MaxPageSize)
            return this.BadRequestProblem(
                $"pageSize must be between 1 and {PagingParameters.MaxPageSize}.",
                ProblemTypes.ValidationFailed);

        if (!await AuthorityRunExistsInScopeAsync(runId, cancellationToken))
            return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);

        PagingParameters paging = new()
        {
            PageNumber = pageNumber,
            PageSize = pageSize
        };
        (int skip, int take) = paging.Normalize();

        (IReadOnlyList<AgentExecutionTrace> pagedTraces, int totalCount) =
            await agentExecutionTraceRepository.GetPagedByRunIdAsync(
                runId,
                skip,
                take,
                cancellationToken);

        return Ok(new AgentExecutionTraceResponse
        {
            Traces = pagedTraces.ToList(),
            TotalCount = totalCount,
            PageNumber = paging.PageNumber,
            PageSize = paging.PageSize
        });
    }

    /// <summary>
    ///     Lists runs visible in the current scope. Without <paramref name="cursor" />, uses offset pagination via
    ///     <paramref name="limit" /> and <paramref name="offset" />; with <paramref name="cursor" />, uses keyset
    ///     continuation.
    /// </summary>
    [HttpGet("runs")]
    [HttpGet("/v{version:apiVersion}/runs")]
    [ProducesResponseType(typeof(CursorPagedResponse<RunListItemResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListRuns(
        [FromQuery] string? cursor = null,
        [FromQuery] int? limit = null,
        [FromQuery] int offset = 0,
        [FromQuery] int take = RunPagination.DefaultTake,
        [FromQuery] int page = PaginationDefaults.DefaultPage,
        [FromQuery] int pageSize = PaginationDefaults.DefaultPageSize,
        CancellationToken cancellationToken = default)
    {
        if (!string.IsNullOrWhiteSpace(cursor))
        {
            int effectiveTake = RunPagination.ClampTake(take);

            (IReadOnlyList<RunSummary> keysetSummaries, bool keysetHasMore, string? nextCursor) =
                await runDetailQueryService.ListRunSummariesKeysetAsync(cursor, effectiveTake, cancellationToken);

            return Ok(MapRunListPage(keysetSummaries, keysetHasMore, nextCursor, effectiveTake));
        }

        int effectiveLimit = RunPagination.ClampLimit(limit ?? pageSize);
        int effectiveOffset = offset > 0
            ? RunPagination.NormalizeOffset(offset)
            : PaginationDefaults.ToSkip(page, effectiveLimit);

        (IReadOnlyList<RunSummary> offsetSummaries, bool offsetHasMore) =
            await runDetailQueryService.ListRunSummariesOffsetAsync(effectiveOffset, effectiveLimit, cancellationToken);

        return Ok(MapRunListPage(offsetSummaries, offsetHasMore, nextCursor: null, effectiveLimit));
    }

    private static CursorPagedResponse<RunListItemResponse> MapRunListPage(
        IReadOnlyList<RunSummary> summaries,
        bool hasMore,
        string? nextCursor,
        int requestedTake)
    {
        List<RunListItemResponse> mapped = summaries
            .Select(r => new RunListItemResponse
            {
                RunId = r.RunId,
                RequestId = r.RequestId,
                Status = r.Status,
                CreatedUtc = r.CreatedUtc,
                CompletedUtc = r.CompletedUtc,
                CurrentManifestVersion = r.CurrentManifestVersion,
                SystemName = r.SystemName
            })
            .ToList();

        return new CursorPagedResponse<RunListItemResponse>
        {
            Items = mapped,
            NextCursor = nextCursor,
            HasMore = hasMore,
            RequestedTake = requestedTake
        };
    }


    /// <summary>
    ///     Returns persisted artifact pointers for one finding (manifest snapshot ids, graph nodes, agent trace ids).
    /// </summary>
    [HttpGet("run/{runId}/findings/{findingId}/evidence-chain")]
    [ProducesResponseType(typeof(FindingEvidenceChainResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetFindingEvidenceChain(
        [FromRoute] string runId,
        [FromRoute] string findingId,
        CancellationToken cancellationToken)
    {
        FindingEvidenceChainResponse? chain =
            await findingEvidenceChainService.BuildAsync(runId, findingId, cancellationToken);

        if (chain is null)
            return this.NotFoundProblem(
                $"Evidence chain is not available for run '{runId}' and finding '{findingId}'.",
                ProblemTypes.ResourceNotFound);

        return Ok(chain);
    }

    /// <summary>
    ///     Same payload as <c>GET /v1/findings/{findingId}/inspect</c>; returns <c>404</c> when the finding&apos;s persisted
    ///     run identifier does not match <paramref name="runId" /> (prevents cross-run ambiguity in deep links).
    /// </summary>
    [HttpGet("run/{runId}/findings/{findingId}/inspect")]
    [ProducesResponseType(typeof(FindingInspectResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetFindingInspectForRun(
        [FromRoute] string runId,
        [FromRoute] string findingId,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(runId))
            return this.BadRequestProblem("Run id is required.", ProblemTypes.ValidationFailed);

        if (string.IsNullOrWhiteSpace(findingId))
            return this.BadRequestProblem("Finding id is required.", ProblemTypes.ValidationFailed);

        if (findingId.Trim().Length > 64)
            return this.BadRequestProblem("Finding id exceeds maximum length (64).", ProblemTypes.ValidationFailed);

        ScopeContext scope = scopeContextProvider.GetCurrentScope();

        FindingInspectResponse? body =
            await findingInspectReadRepository.GetInspectAsync(scope, findingId.Trim(), cancellationToken);

        if (body is null)
        {
            return this.NotFoundProblem(
                $"Finding '{findingId.Trim()}' was not found in the current scope.",
                ProblemTypes.ResourceNotFound);
        }

        if (!SameAuthorityRunIdentifier(runId.Trim(), body.RunId))
        {
            return this.NotFoundProblem(
                $"Finding '{findingId.Trim()}' was not found for run '{runId.Trim()}'.",
                ProblemTypes.ResourceNotFound);
        }

        return Ok(body.WithReasoningSummaryFromBuilder(reasoningSummaryBuilder));
    }

    /// <summary>ZIP bundle: run summary, audit slice for the run, and decision traces (size-capped).</summary>
    [HttpGet("run/{runId}/traceability-bundle.zip")]
    [HttpGet("/v{version:apiVersion}/runs/{runId}/review-trail/export")]
    [Produces("application/zip")]
    [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status413PayloadTooLarge)]
    public async Task<IActionResult> GetTraceabilityBundleZip(
        [FromRoute] string runId,
        CancellationToken cancellationToken)
    {
        const long maxZipBytes = 1_500_000L;
        ScopeContext scope = scopeContextProvider.GetCurrentScope();

        try
        {
            byte[]? zip = await traceabilityBundleBuilder.BuildAsync(runId, scope, maxZipBytes, cancellationToken);

            if (zip is null)
                return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);

            Guid? auditRunId = TryParseRunId(runId, out Guid runGuidForAudit) ? runGuidForAudit : null;

            await auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.ExportDownloadSucceeded,
                    RunId = auditRunId,
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ProjectId = scope.ProjectId,
                    CorrelationId = HttpContext.TraceIdentifier,
                    DataJson = JsonSerializer.Serialize(
                        new { exportType = "traceability-bundle.zip", fileName = $"traceability-{runId}.zip" },
                        AuditJsonSerializationOptions.Instance)
                },
                cancellationToken);

            return File(zip, "application/zip", $"traceability-{runId}.zip");
        }
        catch (TraceabilityBundleTooLargeException ex)
        {
            return StatusCode(
                StatusCodes.Status413PayloadTooLarge,
                new
                {
                    title = "Traceability bundle exceeds size cap",
                    detail = ex.Message,
                    attemptedBytes = ex.AttemptedBytes,
                    maxBytes = ex.MaxBytes
                });
        }
    }

    private async Task<bool> AuthorityRunExistsInScopeAsync(string runId, CancellationToken cancellationToken)
    {
        if (!TryParseRunId(runId, out Guid runGuid))
            return false;

        ScopeContext scope = scopeContextProvider.GetCurrentScope();

        return await authorityRunRepository.GetByIdAsync(scope, runGuid, cancellationToken) is not null;
    }

    private static bool TryParseRunId(string runId, out Guid runGuid)
    {
        return Guid.TryParseExact(runId, "N", out runGuid) || Guid.TryParse(runId, out runGuid);
    }

    private static string SanitizeRunIdForFindingExport(string runId)
    {
        if (string.IsNullOrWhiteSpace(runId))
            return "unknown-run";

        string trimmed = runId.Trim();
        ReadOnlySpan<char> invalidChars = Path.GetInvalidFileNameChars();

        StringBuilder stem = new(trimmed.Length);

        foreach (char c in trimmed)
        {
            if (invalidChars.Contains(c))
                stem.Append('_');
            else
                stem.Append(c);
        }

        string built = stem.ToString();

        return string.IsNullOrWhiteSpace(built) ? "unknown-run" : built;
    }

    /// <summary>Hyphen/format-insensitive GUID comparison (aligned with UI <c>sameAuthorityRunId</c>).</summary>
    private static bool SameAuthorityRunIdentifier(string routeRunId, Guid payloadRunId)
    {
        return string.Equals(
            Norm(routeRunId),
            Norm(payloadRunId.ToString("D", CultureInfo.InvariantCulture)),
            StringComparison.Ordinal);

        static string Norm(string value)
        {
            return value.Replace("-", string.Empty, StringComparison.Ordinal).Trim().ToUpperInvariant();
        }
    }
}
