using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.AuditEvidence;

public sealed class AuditContinuousReadinessDiffConsumer(
    IScopeContextProvider scopeContextProvider,
    IAuditContinuousReadinessService continuousReadinessService) : IAzureInventoryDiffConsumer
{
    public async Task OnDiffComputedAsync(
        AzureInventoryDiffSummaryRecord summary,
        IReadOnlyList<AzureInventoryChangeRecord> changes,
        CancellationToken cancellationToken = default)
    {
        ScopeContext scope = scopeContextProvider.GetCurrentScope();

        await continuousReadinessService.ProcessInventoryDiffAsync(
            scope,
            summary,
            changes,
            cancellationToken);
    }
}
