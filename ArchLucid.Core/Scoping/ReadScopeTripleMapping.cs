using ArchLucid.Contracts.Scoping;

namespace ArchLucid.Core.Scoping;

/// <summary>Maps <see cref="ScopeContext" /> to contract-layer <see cref="ReadScopeTriple" /> for scoped repository reads.</summary>
public static class ReadScopeTripleMapping
{
    /// <summary>Projects the scope triple for <see cref="Contracts.Persistence.Ports.IContextSnapshotRepository" /> reads.</summary>
    public static ReadScopeTriple ToReadScope(this ScopeContext scope)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return new ReadScopeTriple(scope.TenantId, scope.WorkspaceId, scope.ProjectId);
    }
}
