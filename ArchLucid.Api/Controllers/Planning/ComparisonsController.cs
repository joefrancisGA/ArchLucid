using ArchLucid.Api.Attributes;
using ArchLucid.Api.Http;
using ArchLucid.Api.Mapping;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Services;
using ArchLucid.Application.Analysis;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Tenancy;
using ArchLucid.Host.Core.Services;

using Asp.Versioning;

using FluentValidation;
using FluentValidation.Results;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

using ApiReplayComparisonRequest = ArchLucid.Api.Models.ReplayComparisonRequest;

namespace ArchLucid.Api.Controllers.Planning;

/// <summary>
///     HTTP API for managing architectural run comparison records, drift analysis, and comparison replay.
/// </summary>
[ApiController]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/architecture")]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class ComparisonsController(
    IComparisonsApplicationService comparisons,
    IComparisonReplayApiService comparisonReplayApiService,
    IValidator<ComparisonHistoryQuery> comparisonHistoryQueryValidator,
    IValidator<ApiReplayComparisonRequest> replayComparisonRequestValidator,
    IValidator<BatchReplayComparisonRequest> batchReplayComparisonRequestValidator)
    : ControllerBase
{
    private readonly IComparisonsApplicationService _comparisons =
        comparisons ?? throw new ArgumentNullException(nameof(comparisons));

    private readonly IComparisonReplayApiService _comparisonReplayApiService =
        comparisonReplayApiService ?? throw new ArgumentNullException(nameof(comparisonReplayApiService));

    private readonly IValidator<ComparisonHistoryQuery> _comparisonHistoryQueryValidator =
        comparisonHistoryQueryValidator ?? throw new ArgumentNullException(nameof(comparisonHistoryQueryValidator));

    private readonly IValidator<ApiReplayComparisonRequest> _replayComparisonRequestValidator =
        replayComparisonRequestValidator ?? throw new ArgumentNullException(nameof(replayComparisonRequestValidator));

    private readonly IValidator<BatchReplayComparisonRequest> _batchReplayComparisonRequestValidator =
        batchReplayComparisonRequestValidator
        ?? throw new ArgumentNullException(nameof(batchReplayComparisonRequestValidator));

    [HttpGet("run/{runId}/comparisons")]
    [ProducesResponseType(typeof(ComparisonHistoryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetRunComparisonHistory(
        [FromRoute] string runId,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<ArchLucid.Contracts.Metadata.ComparisonRecord>? records =
            await _comparisons.TryListByRunIdAsync(runId, cancellationToken);

        return records is null
            ? this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound)
            : Ok(new ComparisonHistoryResponse { Records = records.ToList() });
    }

    [HttpGet("run/exports/{exportRecordId}/comparisons")]
    [ProducesResponseType(typeof(ComparisonHistoryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetExportRecordComparisonHistory(
        [FromRoute] string exportRecordId,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<ArchLucid.Contracts.Metadata.ComparisonRecord>? records =
            await _comparisons.TryListByExportRecordIdAsync(exportRecordId, cancellationToken);

        return records is null
            ? this.NotFoundProblem($"Export record '{exportRecordId}' was not found.", ProblemTypes.ResourceNotFound)
            : Ok(new ComparisonHistoryResponse { Records = records.ToList() });
    }

    [HttpGet("comparisons/{comparisonRecordId}")]
    [ProducesResponseType(typeof(ComparisonRecordResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetComparisonRecord(
        [FromRoute] string comparisonRecordId,
        CancellationToken cancellationToken)
    {
        ArchLucid.Contracts.Metadata.ComparisonRecord? record =
            await _comparisons.TryGetScopedRecordAsync(comparisonRecordId, cancellationToken);

        return record is null
            ? this.NotFoundProblem($"Comparison record '{comparisonRecordId}' was not found.", ProblemTypes.ResourceNotFound)
            : Ok(new ComparisonRecordResponse { Record = record });
    }

    [HttpGet("comparisons/{comparisonRecordId}/replay/cost-estimate")]
    [ProducesResponseType(typeof(ComparisonReplayCostEstimateResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetComparisonReplayCostEstimate(
        [FromRoute] string comparisonRecordId,
        [FromQuery] string? format,
        [FromQuery] string? replayMode,
        [FromQuery] bool persistReplay = false,
        CancellationToken cancellationToken = default)
    {
        try
        {
            ComparisonReplayCostEstimate? estimate = await _comparisons.TryEstimateReplayCostAsync(
                comparisonRecordId,
                format,
                replayMode,
                persistReplay,
                cancellationToken);

            return estimate is null
                ? this.NotFoundProblem(
                    $"Comparison record '{comparisonRecordId}' was not found.",
                    ProblemTypes.ResourceNotFound)
                : Ok(ComparisonReplayCostEstimateResponse.FromDomain(estimate));
        }
        catch (ArgumentException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
    }

    [HttpGet("comparisons/{comparisonRecordId}/summary")]
    [ProducesResponseType(typeof(ComparisonSummaryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetComparisonSummary(
        [FromRoute] string comparisonRecordId,
        CancellationToken cancellationToken)
    {
        ReplayComparisonResult? replay =
            await _comparisons.TryReplaySummaryMarkdownAsync(comparisonRecordId, cancellationToken);

        return replay is null
            ? this.NotFoundProblem($"Comparison record '{comparisonRecordId}' was not found.", ProblemTypes.ResourceNotFound)
            : Ok(new ComparisonSummaryResponse
            {
                ComparisonRecordId = replay.ComparisonRecordId,
                ComparisonType = replay.ComparisonType,
                Format = "markdown",
                Summary = replay.Content ?? string.Empty,
            });
    }

    [HttpGet("comparisons")]
    [ProducesResponseType(typeof(ComparisonHistoryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SearchComparisonRecords(
        [FromQuery] ComparisonHistoryQuery query,
        CancellationToken cancellationToken = default)
    {
        ValidationResult? vr = await _comparisonHistoryQueryValidator.ValidateAsync(query, cancellationToken);

        if (!vr.IsValid)
        {
            return this.BadRequestProblem(
                string.Join(" ", vr.Errors.Select(e => e.ErrorMessage)),
                ProblemTypes.ValidationFailed);
        }

        if (!ApiPaging.TryParseUtcTicksIdCursor(query.Cursor, out DateTime? cursorCreatedUtc, out string? cursorId,
                out string? cursorError))
        {
            return this.BadRequestProblem(cursorError!, ProblemTypes.ValidationFailed);
        }

        ComparisonHistorySearchResult search = await _comparisons.SearchAsync(
            new ComparisonHistorySearchCriteria
            {
                ComparisonType = query.ComparisonType,
                LeftRunId = query.LeftRunId,
                RightRunId = query.RightRunId,
                LeftExportRecordId = query.LeftExportRecordId,
                RightExportRecordId = query.RightExportRecordId,
                Label = query.Label,
                CreatedFromUtc = query.CreatedFromUtc,
                CreatedToUtc = query.CreatedToUtc,
                Tags = ComparisonHistoryQuery.NormalizeTagList(query.Tag, query.Tags),
                SortBy = query.SortBy ?? "createdUtc",
                SortDir = query.SortDir ?? "desc",
                Cursor = query.Cursor,
                Skip = query.Skip,
                Limit = query.Limit,
                UseCursorPaging = Request.Query.ContainsKey("cursor"),
                CursorCreatedUtc = cursorCreatedUtc,
                CursorId = cursorId,
            },
            cancellationToken);

        return Ok(new ComparisonHistoryResponse
        {
            Records = search.Records.ToList(),
            Limit = search.Limit,
            Skip = search.Skip,
            ComparisonType = query.ComparisonType,
            LeftRunId = query.LeftRunId,
            RightRunId = query.RightRunId,
            LeftExportRecordId = query.LeftExportRecordId,
            RightExportRecordId = query.RightExportRecordId,
            Label = query.Label,
            CreatedFromUtc = query.CreatedFromUtc,
            CreatedToUtc = query.CreatedToUtc,
            Tag = query.Tag,
            Tags = ComparisonHistoryQuery.NormalizeTagList(query.Tag, query.Tags),
            SortBy = query.SortBy ?? "createdUtc",
            SortDir = query.SortDir ?? "desc",
            NextCursor = search.NextCursor,
        });
    }

    [HttpPatch("comparisons/{comparisonRecordId}")]
    [ProducesResponseType(typeof(ComparisonRecordResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateComparisonRecord(
        [FromRoute] string comparisonRecordId,
        [FromBody] UpdateComparisonRecordRequest? request,
        CancellationToken cancellationToken = default)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        ArchLucid.Contracts.Metadata.ComparisonRecord? record = await _comparisons.TryUpdateLabelAndTagsAsync(
            comparisonRecordId,
            request.Label,
            request.Tags,
            cancellationToken);

        return record is null
            ? this.NotFoundProblem($"Comparison record '{comparisonRecordId}' was not found.", ProblemTypes.ResourceNotFound)
            : Ok(new ComparisonRecordResponse { Record = record });
    }

    [HttpPost("comparisons/{comparisonRecordId}/replay")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [Authorize(Policy = ArchLucidPolicies.CanReplayComparisons)]
    [EnableRateLimiting("replay")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status206PartialContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> ReplayComparison(
        [FromRoute] string comparisonRecordId,
        [FromQuery] string? format,
        [FromBody] ApiReplayComparisonRequest? request,
        CancellationToken cancellationToken)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        ValidationResult replayBodyValidation =
            await _replayComparisonRequestValidator.ValidateAsync(request, cancellationToken);

        if (!replayBodyValidation.IsValid)
        {
            return this.BadRequestProblem(
                string.Join(" ", replayBodyValidation.Errors.Select(e => e.ErrorMessage)),
                ProblemTypes.ValidationFailed);
        }

        ReplayComparisonResult? result = await _comparisons.TryReplayAsync(
            ReplayComparisonRequestMapper.ToApplicationForReplayEndpoint(comparisonRecordId, request, format),
            cancellationToken);

        if (result is null)
        {
            return this.NotFoundProblem($"Comparison record '{comparisonRecordId}' was not found.",
                ProblemTypes.ResourceNotFound);
        }

        ReplayComparisonResultHeaders.ApplyFull(Response, result);

        return ReplayArtifactResponseFactory.ComparisonReplayFileOrBadRequest(
            Request,
            result,
            () => this.BadRequestProblem(
                $"Unsupported replay result format '{result.Format}'.",
                ProblemTypes.BadRequest));
    }

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

    [HttpPost("comparisons/{comparisonRecordId}/replay/metadata")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [Authorize(Policy = ArchLucidPolicies.CanReplayComparisons)]
    [EnableRateLimiting("replay")]
    [ProducesResponseType(typeof(ReplayComparisonMetadataResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ReplayComparisonMetadata(
        [FromRoute] string comparisonRecordId,
        [FromBody] ApiReplayComparisonRequest? request,
        CancellationToken cancellationToken)
    {
        request ??= new ApiReplayComparisonRequest();

        ValidationResult metadataReplayValidation =
            await _replayComparisonRequestValidator.ValidateAsync(request, cancellationToken);

        if (!metadataReplayValidation.IsValid)
        {
            return this.BadRequestProblem(
                string.Join(" ", metadataReplayValidation.Errors.Select(e => e.ErrorMessage)),
                ProblemTypes.ValidationFailed);
        }

        if (await _comparisons.TryGetScopedRecordAsync(comparisonRecordId, cancellationToken) is null)
        {
            return this.NotFoundProblem($"Comparison record '{comparisonRecordId}' was not found.",
                ProblemTypes.ResourceNotFound);
        }

        ReplayComparisonResult result = await _comparisonReplayApiService.ReplayAsync(
            ReplayComparisonRequestMapper.ToApplication(comparisonRecordId, request),
            true,
            cancellationToken);

        ReplayComparisonResultHeaders.ApplyMetadata(Response, result);

        return Ok(new ReplayComparisonMetadataResponse
        {
            ComparisonRecordId = result.ComparisonRecordId,
            ComparisonType = result.ComparisonType,
            Format = result.Format,
            FileName = result.FileName,
            ReplayMode = result.ReplayMode,
            VerificationPassed = result.VerificationPassed,
            VerificationMessage = result.VerificationMessage,
            DriftAnalysis = result.DriftAnalysis is null ? null : MapDriftAnalysis(result.DriftAnalysis),
            LeftRunId = result.LeftRunId,
            RightRunId = result.RightRunId,
            LeftExportRecordId = result.LeftExportRecordId,
            RightExportRecordId = result.RightExportRecordId,
            CreatedUtc = result.CreatedUtc,
            FormatProfile = result.FormatProfile,
            PersistedReplayRecordId = result.PersistedReplayRecordId,
        });
    }

    [HttpPost("comparisons/replay/batch")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [Authorize(Policy = ArchLucidPolicies.CanReplayComparisons)]
    [EnableRateLimiting("replay")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> ReplayComparisonsBatch(
        [FromBody] BatchReplayComparisonRequest? request,
        CancellationToken cancellationToken)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        ValidationResult batchValidation =
            await _batchReplayComparisonRequestValidator.ValidateAsync(request, cancellationToken);

        if (!batchValidation.IsValid)
        {
            return this.BadRequestProblem(
                string.Join(" ", batchValidation.Errors.Select(e => e.ErrorMessage)),
                ProblemTypes.ValidationFailed);
        }

        Application.Analysis.ComparisonBatchReplay.ComparisonBatchReplayZipResult? zipResult =
            await _comparisons.TryBuildBatchReplayZipAsync(
                request.ComparisonRecordIds,
                request.Format,
                request.ReplayMode,
                request.Profile,
                request.PersistReplay,
                cancellationToken);

        if (zipResult is null)
        {
            return this.UnprocessableEntityProblem(
                "No comparison replays succeeded for the requested comparisonRecordIds. Adjust IDs or replay parameters and retry.",
                ProblemTypes.BatchReplayAllFailed);
        }

        if (zipResult.IsPartialSuccess)
            Response.Headers.Append(ArchLucidHttpHeaders.BatchReplayPartial, "true");

        return File(zipResult.ZipBytes, "application/zip", "comparison_replays.zip");
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
