using ArchLucid.Application.Analysis;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

public sealed class SecureNowArchitectDiffConsumer(
    IScopeContextProvider scopeContextProvider,
    IOptions<SecureNowArchitectNeighborhoodOptions> options,
    ISecureNowArchitectNeighborhoodRunner neighborhoodRunner) : IAzureInventoryDiffConsumer
{
    public async Task OnDiffComputedAsync(
        AzureInventoryDiffSummaryRecord summary,
        IReadOnlyList<AzureInventoryChangeRecord> changes,
        CancellationToken cancellationToken = default)
    {
        if (SecureNowAnalysisRun.ExecutionBudget?.RecoverySession is { Versioned: true })
            return; // The coordinator applies the pinned, verified reuse plan instead of legacy neighborhood carry-forward.

        if (SecureNowAnalysisRun.ExecutionBudget?.RecoverySession?.FullRecompute ?? options.Value.FullRecompute)
        {
            return;
        }

        if (changes.Count == 0)
        {
            return;
        }

        ScopeContext scope = scopeContextProvider.GetCurrentScope();

        SecureNowArchitectNeighborhoodRecomputeResult result =
            await neighborhoodRunner.RecomputeNeighborhoodAsync(scope, summary, changes, cancellationToken);

        if (!result.Succeeded)
            throw new AnalysisStageExecutionException("securenow.neighborhood", AnalysisStageOutcome.Failed);
    }
}
