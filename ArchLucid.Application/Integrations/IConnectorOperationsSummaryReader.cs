using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Integrations;

/// <summary>Read-only, tenant-scoped connector posture for the operations dashboard (no secrets).</summary>
public interface IConnectorOperationsSummaryReader
{
    Task<ConnectorOperationsSummary> GetSummaryAsync(ScopeContext scope, CancellationToken cancellationToken);
}
