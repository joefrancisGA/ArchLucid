using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Coordination.Cosmos;
using ArchLucid.Persistence.Cosmos;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Host.Composition.Tests.Coordination;

[Trait("Suite", "Core")]
public sealed class CosmosGraphSnapshotOutboxProcessorTests
{
    [Fact]
    public async Task ProcessPendingBatchAsync_pushes_ambient_scope_before_cosmos_save()
    {
        Guid outboxId = Guid.NewGuid();
        Guid graphSnapshotId = Guid.NewGuid();
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        ScopeContext? ambientDuringCosmosSave = null;

        GraphSnapshot snapshot = new()
        {
            GraphSnapshotId = graphSnapshotId,
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        Mock<ICosmosGraphSnapshotOutboxRepository> outbox = new();
        outbox
            .Setup(o => o.DequeuePendingAsync(25, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new CosmosGraphSnapshotOutboxEntry
                {
                    OutboxId = outboxId,
                    GraphSnapshotId = graphSnapshotId,
                    RunId = snapshot.RunId,
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId,
                    CreatedUtc = TimeProvider.System.UtcNowDateTime()
                }
            ]);
        outbox.Setup(o => o.MarkProcessedAsync(outboxId, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        Mock<ICosmosGraphSnapshotOutboxSqlLoader> sqlLoader = new();
        sqlLoader
            .Setup(l => l.LoadAsync(It.IsAny<ScopeContext>(), graphSnapshotId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(snapshot);

        Mock<ICosmosGraphSnapshotOutboxCosmosWriter> cosmosWriter = new();
        cosmosWriter
            .Setup(w => w.SaveAsync(snapshot, It.IsAny<CancellationToken>()))
            .Callback(() => ambientDuringCosmosSave = AmbientScopeContext.CurrentOverride)
            .Returns(Task.CompletedTask);

        ServiceCollection services = [];
        services.AddScoped(_ => outbox.Object);
        services.AddScoped(_ => sqlLoader.Object);
        services.AddScoped(_ => cosmosWriter.Object);
        ServiceProvider provider = services.BuildServiceProvider();

        CosmosGraphSnapshotOutboxProcessor sut = new(
            provider.GetRequiredService<IServiceScopeFactory>(),
            Options.Create(new CosmosGraphSnapshotOutboxProcessorOptions()),
            TimeProvider.System,
            NullLogger<CosmosGraphSnapshotOutboxProcessor>.Instance);

        await sut.ProcessPendingBatchAsync(CancellationToken.None);

        ambientDuringCosmosSave.Should().NotBeNull();
        ambientDuringCosmosSave!.TenantId.Should().Be(tenantId);
        ambientDuringCosmosSave.WorkspaceId.Should().Be(workspaceId);
        ambientDuringCosmosSave.ProjectId.Should().Be(projectId);
        outbox.Verify(o => o.MarkProcessedAsync(outboxId, It.IsAny<CancellationToken>()), Times.Once);
    }
}
