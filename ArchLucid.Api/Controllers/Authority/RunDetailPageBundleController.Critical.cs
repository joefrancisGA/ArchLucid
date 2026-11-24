using ArchLucid.Api.Contracts;
using ArchLucid.Api.Models.Runs;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Support;
using ArchLucid.Application;
using ArchLucid.Application.Audit;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Finalization;
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
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> GetCriticalPageBundle(Guid runId, CancellationToken cancellationToken)
    {
        try
        {
            ScopeContext scope = _scopeProvider.GetCurrentScope();

            IActionResult? denied = await EnsurePageBundleRunShareReadAllowedAsync(
                scope, runId, cancellationToken);
            if (denied is not null)
                return denied;

            RunDetailDto? detail =
                await _queryService.GetRunDetailForBuyerSummaryAsync(scope, runId, cancellationToken).ConfigureAwait(false);

            if (detail is null)
            {
                return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);
            }

            IActionResult? sealedGuardResult = EnsureSealedManifestReadAllowed(detail, runId);

            if (sealedGuardResult is not null)
                return sealedGuardResult;

            Guid? manifestId = detail.Run.GoldenManifestId;
            ManifestSummaryDto? manifest = null;

            if (manifestId is Guid pinnedId)
            {
                // A buyer-summary projection does not hydrate the manifest.
                // Verify the exact pinned summary against the sealed document
                // before starting artifact descriptor reads or exporting it.
                Task<ManifestSummaryDto?> summaryTask =
                    _queryService.GetManifestSummaryAsync(scope, pinnedId, cancellationToken);
                Task<RunDetailDto?> pinnedTask =
                    _queryService.GetRunDetailForManifestCompareAsync(scope, runId, cancellationToken);
                await Task.WhenAll(summaryTask, pinnedTask).ConfigureAwait(false);

                manifest = await summaryTask.ConfigureAwait(false);
                RunDetailDto? pinnedDetail = await pinnedTask.ConfigureAwait(false);
                if (manifest is null)
                {
                    throw new ConflictException(
                        $"Run '{runId:D}' references a missing golden manifest '{pinnedId:D}'.");
                }

                SealedManifestReadGuard.EnsureManifestSummaryBindingAndHashesOrThrow(
                    scope, pinnedId, manifest, pinnedDetail?.GoldenManifest,
                    pinnedDetail, _manifestHashService);
            }

            BuyerRunDetailSummaryDto buyerSummary = await BuildBuyerSummaryAsync(detail, cancellationToken)
                .ConfigureAwait(false);

            Task<RunSummaryDto?> progressTask =
                _queryService.GetRunSummaryAsync(scope, runId, cancellationToken);

            Task<IReadOnlyList<ArtifactDescriptor>> artifactsTask = manifestId.HasValue
                ? _artifactQueryService.ListArtifactsByManifestIdAsync(scope, manifestId.Value, cancellationToken)
                : Task.FromResult<IReadOnlyList<ArtifactDescriptor>>([]);

            Task<IReadOnlyList<ArtifactDescriptor>> verificationArtifactsTask =
                _findingVerificationReportQueryService.ListArtifactDescriptorsByRunAsync(
                    scope, runId, cancellationToken);

            await Task.WhenAll(progressTask, artifactsTask, verificationArtifactsTask)
                .ConfigureAwait(false);

            RunSummaryDto? progress = await progressTask.ConfigureAwait(false);
            IReadOnlyList<ArtifactDescriptor> artifacts = await artifactsTask.ConfigureAwait(false);
            IReadOnlyList<ArtifactDescriptor> verificationArtifacts =
                await verificationArtifactsTask.ConfigureAwait(false);

            RunDetailCriticalPageBundleResponse body = new()
            {
                BuyerSummary = buyerSummary,
                ProgressSummary = progress is null ? null : ToRunSummaryResponse(progress),
                ManifestSummary = manifest is null ? null : ToManifestSummaryResponse(manifest),
                Artifacts = manifestId.HasValue
                    ? RunArtifactDescriptorResponses.MergeForRun(
                        manifestId.Value,
                        runId,
                        artifacts,
                        verificationArtifacts)
                    : [],
            };

            return Ok(body);
        }
        catch (ConflictException ex)
        {
            return MapRunDetailPageBundleSealedManifestConflict(ex);
        }
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
