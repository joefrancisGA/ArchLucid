using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Repositories;
using ArchLucid.Contracts.Scoping;
using ArchLucid.Core.Scoping;
using FluentAssertions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Category", "Unit")]
public sealed class InMemoryContextSnapshotScopedReadTests
{
    private static readonly ScopeContext TenantAScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    private static readonly ReadScopeTriple TenantBReadScope = new(
        Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
        Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
        Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff"));

    [Fact]
    public async Task GetByIdAsync_rejects_cross_tenant_scope_when_snapshot_saved_with_scope()
    {
        InMemoryContextSnapshotRepository repository =
            new(new FixedScopeContextProvider(TenantAScope));

        ContextSnapshot snapshot = new()
        {
            SnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            ProjectId = "proj-scope",
            CreatedUtc = DateTime.UtcNow,
            CanonicalObjects = [],
            Warnings = [],
            Errors = [],
            SourceHashes = [],
        };

        await repository.SaveAsync(snapshot, CancellationToken.None);

        ContextSnapshot? crossTenant =
            await repository.GetByIdAsync(TenantBReadScope, snapshot.SnapshotId, CancellationToken.None);

        crossTenant.Should().BeNull();
    }

    private sealed class FixedScopeContextProvider(ScopeContext scope) : IScopeContextProvider
    {
        public ScopeContext GetCurrentScope() => scope;
    }
}
