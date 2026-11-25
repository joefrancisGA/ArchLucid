using System.Collections.Concurrent;

using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed class InMemoryArchitectureIntelligenceStandaloneRunStore : IArchitectureIntelligenceStandaloneRunStore
{
    private readonly ConcurrentDictionary<Guid, (Guid TenantId, Guid WorkspaceId, Guid ProjectId, string ActorId)> _owners = new();

    public Task BindNewAsync(ScopeContext scope, Guid runId, string actorId, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        if (!_owners.TryAdd(runId, (scope.TenantId, scope.WorkspaceId, scope.ProjectId, actorId)))
            throw new InvalidOperationException("Standalone run is already bound.");

        return Task.CompletedTask;
    }

    public Task<bool> IsOwnedByAsync(
        ScopeContext scope,
        Guid runId,
        string actorId,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        return Task.FromResult(_owners.TryGetValue(runId, out var owner)
            && owner == (scope.TenantId, scope.WorkspaceId, scope.ProjectId, actorId));
    }
}
