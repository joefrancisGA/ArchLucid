using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;
using FluentAssertions;

namespace ArchLucid.Persistence.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Persistence")]
public sealed class NoOpAzureInventorySnapshotRepositoryTests
{
    [Fact]
    public async Task TryGetBySnapshotIdAsync_returns_null_for_unknown_id_not_default_header()
    {
        NoOpAzureInventorySnapshotRepository repository = new();
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };
        Guid unknownSnapshotId = Guid.NewGuid();

        AzureInventorySnapshotRecord? header =
            await repository.TryGetBySnapshotIdAsync(scope, unknownSnapshotId);

        header.Should().BeNull();
    }

    [Fact]
    public async Task TryGetSnapshotDetailAsync_returns_null_for_unknown_id()
    {
        NoOpAzureInventorySnapshotRepository repository = new();
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };
        Guid unknownSnapshotId = Guid.NewGuid();

        AzureInventorySnapshotDetailReadModel? detail =
            await repository.TryGetSnapshotDetailAsync(scope, unknownSnapshotId);

        detail.Should().BeNull();
    }
}