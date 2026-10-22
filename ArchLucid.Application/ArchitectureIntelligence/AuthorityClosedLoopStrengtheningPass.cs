using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed class AuthorityClosedLoopStrengtheningPass(
    IClosedLoopArchitectureReasoningOrchestrator closedLoopOrchestrator,
    IArchitectureIntelligenceProductRunSourceContextLoader sourceContextLoader,
    IClosedLoopManifestMerger manifestMerger,
    IArchitectureIntelligenceProductPublishService productPublishService,
    IArchitectureRequestRepository? architectureRequestRepository,
    IOptionsMonitor<ArchitectureIntelligencePipelineOptions> options,
    ILogger<AuthorityClosedLoopStrengtheningPass> logger) : IAuthorityClosedLoopStrengtheningPass
{
    public async Task TryStrengthenManifestAsync(
        ScopeContext scope,
        RunRecord run,
        ContextIngestionRequest request,
        ManifestDocument manifest,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(run);
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(manifest);

        if (!options.CurrentValue.StrengthenDefaultPackage && !options.CurrentValue.StrengthenAllReviewPackages)
            return;

        if (!options.CurrentValue.StrengthenAllReviewPackages && !IsGoldenCohortSystem(request.ProjectId))
            return;

        try
        {
            ClosedLoopReasoningRequest closedLoopRequest =
                await BuildClosedLoopRequestAsync(run, request, cancellationToken);

            ClosedLoopReasoningResult result =
                await closedLoopOrchestrator.RunAsync(closedLoopRequest, cancellationToken);

            if (result.BudgetRejected || result.PublishBlocked)
                return;

            ArchitectureRequest? architectureRequest =
                await TryLoadArchitectureRequestAsync(run, cancellationToken);

            manifestMerger.MergeStrengtheningResult(manifest, result, architectureRequest);

            if (result.ProductFindings.Count > 0 || result.ProductRecommendations.Count > 0)
            {
                await productPublishService.PublishAsync(
                    result,
                    scope.TenantId.ToString("D"),
                    scope.WorkspaceId.ToString("D"),
                    scope.ProjectId.ToString("D"),
                    run.RunId.ToString("D"),
                    cancellationToken);
            }
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            if (logger.IsEnabled(LogLevel.Warning))
            {
                logger.LogWarning(
                    ex,
                    "Closed-loop strengthening pass failed for run {RunId}; continuing without blocking commit.",
                    run.RunId);
            }
        }
    }

    private async Task<ClosedLoopReasoningRequest> BuildClosedLoopRequestAsync(
        RunRecord run,
        ContextIngestionRequest request,
        CancellationToken cancellationToken)
    {
        ArchitectureIntelligenceProductRunSourceContextLoadResult loaded =
            await sourceContextLoader.LoadAsync(run.RunId.ToString("D"), cancellationToken);

        if (loaded is { HasContent: true, Request: not null })
        {
            ClosedLoopReasoningRequest prepared = loaded.Request;
            prepared.PublishToProduct = true;
            prepared.ContinueFromExistingRun = false;
            return prepared;
        }

        return new ClosedLoopReasoningRequest
        {
            TenantId = run.TenantId.ToString("D"),
            WorkspaceId = run.WorkspaceId.ToString("D"),
            ProjectId = run.ProjectId,
            RunId = run.RunId.ToString("D"),
            SourceTexts =
            [
                new ClosedLoopReasoningSourceText
                {
                    FileName = "context-description.txt",
                    Content = request.Description ?? request.ProjectId,
                    ContentType = "text/plain",
                },
            ],
            PublishToProduct = true,
        };
    }

    private async Task<ArchitectureRequest?> TryLoadArchitectureRequestAsync(
        RunRecord run,
        CancellationToken cancellationToken)
    {
        if (architectureRequestRepository is null || string.IsNullOrWhiteSpace(run.ArchitectureRequestId))
            return null;

        return await architectureRequestRepository
            .GetByIdAsync(run.ArchitectureRequestId, cancellationToken);
    }

    private static bool IsGoldenCohortSystem(string systemName) =>
        systemName.StartsWith("GoldenCohort", StringComparison.OrdinalIgnoreCase);
}
