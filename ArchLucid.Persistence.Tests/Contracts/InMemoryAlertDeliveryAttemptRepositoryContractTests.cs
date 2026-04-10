using ArchLucid.Decisioning.Alerts.Delivery;

namespace ArchLucid.Persistence.Tests.Contracts;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InMemoryAlertDeliveryAttemptRepositoryContractTests : AlertDeliveryAttemptRepositoryContractTests
{
    protected override IAlertDeliveryAttemptRepository CreateRepository()
    {
        return new InMemoryAlertDeliveryAttemptRepository();
    }
}
