using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Integrations.Itsm.Outbound;

/// <summary>Issues lightweight read-only vendor pings for configured outbound ITSM integrations.</summary>
public interface IItsmOutboundIntegrationHealthService
{
    Task<ItsmOutboundIntegrationHealthReport> GetHealthAsync(ScopeContext scope, CancellationToken cancellationToken);
}
