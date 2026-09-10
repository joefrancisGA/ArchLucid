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
        if (options.Value.FullRecompute)
        {
            return;
        }

        if (changes.Count == 0)
        {
            return;
        }

        ScopeContext scope = scopeContextProvider.GetCurrentScope();

        await neighborhoodRunner.RecomputeNeighborhoodAsync(scope, summary, changes, cancellationToken);
    }
}
