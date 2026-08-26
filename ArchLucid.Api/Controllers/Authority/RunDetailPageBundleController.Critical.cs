using ArchLucid.Api.Contracts;
using ArchLucid.Api.Models.Runs;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Support;
using ArchLucid.Application.Audit;
using ArchLucid.Application.Runs;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Runs;
using ArchLucid.Core.DevTesting;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Queries;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Authority;

public sealed partial class RunDetailPageBundleController
{
    /// <summary>First-paint bundle: buyer summary + progress + manifest summary + artifacts.</summary>
    [HttpGet("critical-page-bundle")]
    [ProducesResponseType(typeof(RunDetailCriticalPageBundleResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCriticalPageBundle(Guid runId, CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        RunDetailDto? detail =
            await _queryService.GetRunDetailForBuyerSummaryAsync(scope, runId, cancellationToken).ConfigureAwait(false);

        if (detail is null)
        {
            return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);
        }

        BuyerRunDetailSummaryDto buyerSummary = await BuildBuyerSummaryAsync(detail, cancellationToken).ConfigureAwait(false);

        Task<RunSummaryDto?> progressTask = _queryService.GetRunSummaryAsync(scope, runId, cancellationToken);

        Guid? manifestId = detail.Run.GoldenManifestId;

        Task<ManifestSummaryDto?> manifestTask = manifestId.HasValue
            ? _queryService.GetManifestSummaryAsync(scope, manifestId.Value, cancellationToken)
            : Task.FromResult<ManifestSummaryDto?>(null);

        Task<IReadOnlyList<ArtifactDescriptor>> artifactsTask = manifestId.HasValue
            ? _artifactQueryService.ListArtifactsByManifestIdAsync(scope, manifestId.Value, cancellationToken)
            : Task.FromResult<IReadOnlyList<ArtifactDescriptor>>([]);

        await Task.WhenAll(progressTask, manifestTask, artifactsTask).ConfigureAwait(false);

        RunSummaryDto? progress = await progressTask.ConfigureAwait(false);
        ManifestSummaryDto? manifest = await manifestTask.ConfigureAwait(false);
        IReadOnlyList<ArtifactDescriptor> artifacts = await artifactsTask.ConfigureAwait(false);

        RunDetailCriticalPageBundleResponse body = new()
        {
            BuyerSummary = buyerSummary,
            ProgressSummary = progress is null ? null : ToRunSummaryResponse(progress),
            ManifestSummary = manifest is null ? null : ToManifestSummaryResponse(manifest),
            Artifacts = manifestId.HasValue
                ? artifacts.Select(a => ArtifactDescriptorResponse.From(a, manifestId.Value)).ToList()
                : [],
        };

        return Ok(body);
    }

    private async Task<BuyerRunDetailSummaryDto> BuildBuyerSummaryAsync(
        RunDetailDto detail,
        CancellationToken cancellationToken)
    {
        detail.ExecutionFlavorBuyerSummary = RunExecutionFlavorSummary.Build(
            detail.Run.RealModeFellBackToSimulator,
            _effectiveAgentExecutionModeAccessor.GetEffectiveMode());

        try
        {
            await _runDetailOperatorEnricher
                .EnrichBuyerSummaryAsync(detail, _effectiveAgentExecutionModeAccessor.GetEffectiveMode(), cancellationToken)
                .ConfigureAwait(false);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "Buyer-summary enrichment failed for run {RunId}; returning unenriched proof DTO.",
                detail.Run.RunId);
        }

        return RunDetailBuyerMapper.Map(detail);
    }
}
