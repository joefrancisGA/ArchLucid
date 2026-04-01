using ArchiForge.Decisioning.Alerts.Delivery;

using ArchiForge.Persistence.Alerts;

namespace ArchiForge.Persistence.Tests.Contracts;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InMemoryAlertDeliveryAttemptRepositoryContractTests : AlertDeliveryAttemptRepositoryContractTests
{
    protected override IAlertDeliveryAttemptRepository CreateRepository()
    {
        return new InMemoryAlertDeliveryAttemptRepository();
    }
}
