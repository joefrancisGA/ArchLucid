using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Tests.Support;

/// <summary>Fresh per-test scope for repositories that share a SQL catalog with other cases and runs.</summary>
internal static class IsolatedPersistenceTestScope
{
    internal static ScopeContext New() => new()
    {
        TenantId = Guid.NewGuid(),
        WorkspaceId = Guid.NewGuid(),
        ProjectId = Guid.NewGuid(),
    };
}
