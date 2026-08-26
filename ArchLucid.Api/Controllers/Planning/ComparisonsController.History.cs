using ArchLucid.Api.Http;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Analysis;
using ArchLucid.Core.Pagination;

using FluentValidation.Results;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Planning;

public sealed partial class ComparisonsController
{
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
}
