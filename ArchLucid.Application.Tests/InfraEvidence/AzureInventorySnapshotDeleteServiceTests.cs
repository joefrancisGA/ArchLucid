using ArchLucid.Application.InfraEvidence;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventorySnapshotDeleteServiceTests
{
    [Fact]
    public async Task TryDeleteAsync_delegates_to_repository()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        Guid snapshotId = Guid.NewGuid();
        AzureInventorySnapshotDeleteResult expected = new()
        {
            Outcome = AzureInventorySnapshotDeleteOutcome.Deleted,
        };

        Mock<IAzureInventorySnapshotRepository> repository = new();
        repository
            .Setup(repo => repo.TryDeleteSnapshotAsync(scope, snapshotId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        AzureInventorySnapshotDeleteService service = new(repository.Object);

        AzureInventorySnapshotDeleteResult result = await service.TryDeleteAsync(scope, snapshotId, CancellationToken.None);

        result.Should().BeEquivalentTo(expected);
    }
}
