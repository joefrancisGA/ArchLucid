using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Repositories;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Moq;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InMemoryContextSnapshotRepositoryScopeTests
{
    [Fact]
    public async Task GetLatestAsync_does_not_return_snapshot_saved_by_different_tenant_for_same_project()
    {
        ScopeContext currentScope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider
            .Setup(provider => provider.GetCurrentScope())
            .Returns(() => currentScope);

        InMemoryContextSnapshotRepository repository = new(scopeProvider.Object);
        ContextSnapshot snapshot = new()
        {
            SnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            ProjectId = "shared-project",
            CreatedUtc = DateTime.UtcNow,
        };

        await repository.SaveAsync(snapshot, CancellationToken.None);

        currentScope = new ScopeContext
        {
            TenantId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            WorkspaceId = currentScope.WorkspaceId,
            ProjectId = currentScope.ProjectId,
        };

        ContextSnapshot? latest = await repository.GetLatestAsync("shared-project", CancellationToken.None);

        latest.Should().BeNull();
    }
}
