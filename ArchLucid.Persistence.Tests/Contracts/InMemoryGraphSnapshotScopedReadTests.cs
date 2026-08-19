using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph.Models;
using ArchLucid.KnowledgeGraph.Repositories;
using ArchLucid.Persistence.Tests.Support;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Contracts;

[Trait("Category", "Unit")]
public sealed class InMemoryGraphSnapshotScopedReadTests
{
    private static readonly ScopeContext TenantAScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    private static readonly ScopeContext TenantBScope = new()
    {
        TenantId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
        WorkspaceId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
        ProjectId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff"),
    };

    [Fact]
    public async Task GetByIdAsync_rejects_cross_tenant_scope_when_snapshot_saved_with_scope()
    {
        InMemoryGraphSnapshotRepository repository =
            new(new FixedPersistenceScopeContextProvider(TenantAScope));

        GraphSnapshot snapshot = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            Nodes = [],
            Edges = [],
            Warnings = [],
        };

        await repository.SaveAsync(snapshot, CancellationToken.None);

        GraphSnapshot? crossTenant =
            await repository.GetByIdAsync(TenantBScope, snapshot.GraphSnapshotId, CancellationToken.None);

        crossTenant.Should().BeNull();
    }
}
