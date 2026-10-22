using ArchLucid.Application.SecureNow;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Persistence.ApplicationPorts.Data.Repositories;
using ArchLucid.Core.Persistence.ApplicationPorts.SecureNow;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.SecureNow;

using Moq;

namespace ArchLucid.Application.Tests.SecureNow;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CollectionRunTriggerServiceTests
{
    [Fact]
    public async Task TriggerAsync_returns_same_run_for_repeated_idempotency_key()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };
        Mock<ICollectionRunRepository> repository = new();
        Mock<ICollectionRunTrigger> trigger = new();
        Mock<IAuditService> audit = new();
        CollectionRun? storedRun = null;

        repository
            .Setup(item => item.GetAsync(scope, It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => storedRun);
        repository
            .Setup(item => item.UpsertAsync(It.IsAny<CollectionRun>(), It.IsAny<CancellationToken>()))
            .Callback<CollectionRun, CancellationToken>((run, _) => storedRun = run)
            .Returns(Task.CompletedTask);
        trigger
            .Setup(item => item.TriggerAsync(scope, It.IsAny<CollectionRunTriggerRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CollectionRunTriggerResult { Schedule = "Daily" });

        CollectionRunTriggerService service = new(
            repository.Object,
            trigger.Object,
            new InMemoryCollectionRunTriggerIdempotencyStore(),
            audit.Object);

        CollectionRun first = await service.TriggerAsync(scope, "double-click", ["subscription-1"], CancellationToken.None);
        CollectionRun second = await service.TriggerAsync(scope, "double-click", ["subscription-1"], CancellationToken.None);

        Assert.Equal(first.RunId, second.RunId);
        trigger.Verify(
            item => item.TriggerAsync(scope, It.IsAny<CollectionRunTriggerRequest>(), It.IsAny<CancellationToken>()),
            Times.Once);
        audit.Verify(
            item => item.LogAsync(It.Is<AuditEvent>(auditEvent =>
                auditEvent.EventType == AuditEventTypes.SecureNowCollectionRunTriggered
                && auditEvent.RunId == first.RunId), It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
