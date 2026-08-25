using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed class AuthorityClosedLoopStrengtheningPass(
    IClosedLoopArchitectureReasoningOrchestrator closedLoopOrchestrator,
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
            ClosedLoopReasoningRequest closedLoopRequest = new()
            {
                TenantId = scope.TenantId.ToString("D"),
                WorkspaceId = scope.WorkspaceId.ToString("D"),
                ProjectId = scope.ProjectId.ToString("D"),
                RunId = run.RunId.ToString("D"),
                SourceTexts =
                [
                    new ClosedLoopReasoningSourceText
                    {
                        FileName = manifest.ManifestId.ToString("D"),
                        Content = request.Description ?? request.ProjectId,
                        ContentType = "text/plain",
                    },
                ],
            };

            ClosedLoopReasoningResult result =
                await closedLoopOrchestrator.RunAsync(closedLoopRequest, cancellationToken);

            if (result.Recommendations.Count > 0)
            {
                manifest.Warnings.Add(
                    $"Closed-loop strengthening produced {result.Recommendations.Count} recommendation(s) for golden cohort package.");
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

    private static bool IsGoldenCohortSystem(string systemName) =>
        systemName.StartsWith("GoldenCohort", StringComparison.OrdinalIgnoreCase);
}
