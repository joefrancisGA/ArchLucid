using ArchLucid.Core.Integration;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.IntegrationOutbox;
using ArchLucid.Persistence.Tenancy;

namespace ArchLucid.Persistence.Tests.IntegrationOutbox;

[Trait("Category", "Integration")]
[Collection(nameof(SqlServerPersistenceCollection))]
public sealed class OutboundWebhookDispatchClaimSqlTests(SqlServerPersistenceFixture fixture)
{
    [SkippableFact]
    public async Task One_sql_winner_survives_fresh_instances_and_isolated_destinations()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        DapperOutboundWebhookDispatchClaimStore first = new(new SqlConnectionFactory(fixture.ConnectionString));
        DapperOutboundWebhookDispatchClaimStore second = new(new SqlConnectionFactory(fixture.ConnectionString));
        OutboundWebhookDispatchClaim claim = new(Guid.NewGuid(), Guid.NewGuid(), new string('A', 64));
        TaskCompletionSource release = new(TaskCreationOptions.RunContinuationsAsynchronously);
        Task<bool>[] attempts = Enumerable.Range(0, 16)
            .Select(index => TryAfterReleaseAsync(index % 2 == 0 ? first : second)).ToArray();

        release.SetResult();
        Assert.Single(await Task.WhenAll(attempts), result => result);

        DapperOutboundWebhookDispatchClaimStore fresh = new(new SqlConnectionFactory(fixture.ConnectionString));
        Assert.False(await fresh.TryClaimAsync(claim, CancellationToken.None));
        OutboundWebhookDispatchClaim independentTenant = claim with { TenantId = Guid.NewGuid() };
        Assert.True(await fresh.TryClaimAsync(independentTenant, CancellationToken.None));
        Assert.True(await fresh.TryClaimAsync(claim with { EventId = Guid.NewGuid() }, CancellationToken.None));
        Assert.True(await fresh.TryClaimAsync(claim with { DestinationHash = new string('B', 64) }, CancellationToken.None));

        SqlTenantHardPurgeService purge = new(new SqlConnectionFactory(fixture.ConnectionString));
        TenantHardPurgeResult purged = await purge.PurgeTenantAsync(claim.TenantId,
            new TenantHardPurgeOptions { DryRun = false, MaxRowsPerStatement = 500 }, CancellationToken.None);
        Assert.Equal(3, purged.RowCountsByTable["OutboundWebhookDispatchClaims"]);
        Assert.False(await fresh.TryClaimAsync(independentTenant, CancellationToken.None));

        async Task<bool> TryAfterReleaseAsync(DapperOutboundWebhookDispatchClaimStore store)
        {
            await release.Task;

            return await store.TryClaimAsync(claim, CancellationToken.None);
        }
    }
}
