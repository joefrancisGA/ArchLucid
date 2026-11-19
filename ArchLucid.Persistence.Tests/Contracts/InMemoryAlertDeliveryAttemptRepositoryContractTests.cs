using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Alerts.Delivery;
using ArchLucid.Persistence.Alerts;

namespace ArchLucid.Persistence.Tests.Contracts;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InMemoryAlertDeliveryAttemptRepositoryContractTests : AlertDeliveryAttemptRepositoryContractTests
{
    protected override IAlertDeliveryAttemptRepository CreateRepository(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId)
    {
        _ = tenantId;
        _ = workspaceId;
        _ = projectId;

        return new InMemoryAlertDeliveryAttemptRepository();
    }

    [Fact]
    public async Task Canceled_writes_preserve_alert_delivery_history()
    {
        InMemoryAlertDeliveryAttemptRepository sut = new();
        AlertDeliveryAttempt attempt = new()
        {
            AlertDeliveryAttemptId = Guid.NewGuid(),
            AlertId = Guid.NewGuid(),
            Status = AlertDeliveryAttemptStatus.Started,
        };
        ScopeContext scope = new();
        CancellationToken canceled = new(canceled: true);

        await Assert.ThrowsAnyAsync<OperationCanceledException>(() => sut.CreateAsync(attempt, canceled));
        Assert.Empty(await sut.ListByAlertAsync(scope, attempt.AlertId, CancellationToken.None));

        await sut.CreateAsync(attempt, CancellationToken.None);
        attempt.Status = AlertDeliveryAttemptStatus.Succeeded;
        await Assert.ThrowsAnyAsync<OperationCanceledException>(() => sut.UpdateAsync(attempt, canceled));

        AlertDeliveryAttempt saved = Assert.Single(await sut.ListByAlertAsync(scope, attempt.AlertId, CancellationToken.None));
        Assert.Equal(AlertDeliveryAttemptStatus.Started, saved.Status);
    }
}
