using System.Net;

using ArchLucid.Persistence.Billing;
using ArchLucid.Persistence.Billing.AzureMarketplace;
using ArchLucid.Persistence.Connections;

using static ArchLucid.Persistence.Tests.Billing.MarketplaceFulfillmentActivationTests;

namespace ArchLucid.Persistence.Tests.Billing;

[Trait("Category", "Integration")]
[Collection(nameof(SqlServerPersistenceCollection))]
public sealed class MarketplaceActivationClaimSqlTests(SqlServerPersistenceFixture fixture)
{
    [SkippableFact]
    public async Task An_uncertain_activation_cannot_be_resubmitted_by_another_sql_ledger_instance()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
        Guid subscription = Guid.NewGuid();
        SqlBillingLedger ledger = new(new SqlConnectionFactory(fixture.ConnectionString));
        SqlBillingLedger restartedLedger = new(new SqlConnectionFactory(fixture.ConnectionString));
        ActivationTransport first = new(subscription, null, "PendingFulfillmentStart", "PendingFulfillmentStart");
        ActivationTransport retry = new(subscription, HttpStatusCode.OK, "PendingFulfillmentStart", "Subscribed");
        using ActivationClientFactory initial = new(first);
        using ActivationClientFactory restarted = new(retry);

        await Assert.ThrowsAsync<InvalidOperationException>(() => MarketplaceFulfillmentActivation.EnsureAsync(
            initial, ledger, subscription, "test-token", CancellationToken.None));
        await Assert.ThrowsAsync<InvalidOperationException>(() => MarketplaceFulfillmentActivation.EnsureAsync(
            restarted, restartedLedger, subscription, "test-token", CancellationToken.None));
        await MarketplaceFulfillmentActivation.EnsureAsync(
            restarted, restartedLedger, subscription, "test-token", CancellationToken.None);

        Assert.Equal(new[] { HttpMethod.Get, HttpMethod.Post, HttpMethod.Get }, first.Methods);
        Assert.Equal(new[] { HttpMethod.Get, HttpMethod.Get }, retry.Methods);
    }
}
