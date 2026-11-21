using ArchLucid.Persistence.Cosmos;

namespace ArchLucid.Persistence.Tests.Cosmos;

[Trait("Category", "Unit")]
public sealed class CosmosClientFactoryTests
{
    [Fact]
    public void GetPartitionKeyPath_uses_id_for_audit_change_feed_leases()
    {
        Assert.Equal("/id", CosmosClientFactory.GetPartitionKeyPath("audit-events-leases"));
    }
}
