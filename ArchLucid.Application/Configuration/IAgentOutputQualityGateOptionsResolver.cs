using ArchLucid.Core.Configuration;

namespace ArchLucid.Application.Configuration;

/// <summary>Merges host <see cref="AgentOutputQualityGateOptions" /> with per-tenant <c>dbo.TenantSettings</c> overrides.</summary>
public interface IAgentOutputQualityGateOptionsResolver
{
    AgentOutputQualityGateOptions Resolve(CancellationToken cancellationToken = default);
}
