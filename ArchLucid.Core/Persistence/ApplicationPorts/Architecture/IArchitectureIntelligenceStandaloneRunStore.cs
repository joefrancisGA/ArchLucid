using ArchLucid.Core.Scoping;

namespace ArchLucid.Core.Persistence.ApplicationPorts.Architecture;

/// <summary>Scope and actor bindings for server-issued closed-loop runs without an authority run header.</summary>
public interface IArchitectureIntelligenceStandaloneRunStore
{
    Task BindNewAsync(ScopeContext scope, Guid runId, string actorId, CancellationToken cancellationToken = default);

    Task<bool> IsOwnedByAsync(
        ScopeContext scope,
        Guid runId,
        string actorId,
        CancellationToken cancellationToken = default);
}
