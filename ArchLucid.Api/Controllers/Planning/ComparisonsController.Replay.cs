using ArchLucid.Api.Http;
using ArchLucid.Api.Mapping;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Services;
using ArchLucid.Application;
using ArchLucid.Application.Analysis;
using ArchLucid.Core.Authorization;

using FluentValidation.Results;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

using ApiReplayComparisonRequest = ArchLucid.Api.Models.ReplayComparisonRequest;

namespace ArchLucid.Api.Controllers.Planning;

public sealed partial class ComparisonsController
{
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

    // idempotency-posture: operator-documented-safe-retry
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

    // idempotency-posture: operator-documented-safe-retry
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

    // idempotency-posture: operator-documented-safe-retry
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

        Application.Analysis.ComparisonBatchReplay.ComparisonBatchReplayZipResult? zipResult;

        try
        {
            zipResult = await _comparisons.TryBuildBatchReplayZipAsync(
                request.ComparisonRecordIds,
                request.Format,
                request.ReplayMode,
                request.Profile,
                request.PersistReplay,
                cancellationToken);
        }
        catch (ConflictException ex)
        {
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }

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
}
