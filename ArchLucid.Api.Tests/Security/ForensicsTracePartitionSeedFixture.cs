namespace ArchLucid.Api.Tests.Security;

/// <summary>
///     One greenfield SQL catalog + executed run shared by <see cref="ForensicsTracePartitionIntegrationTests" />
///     so three read-only probes do not each cold-boot DbUp and POST /v1/architecture/request.
/// </summary>
public sealed class ForensicsTracePartitionSeedFixture : IAsyncLifetime
{
    internal bool SqlReachable
    {
        get;
        private set;
    }

    internal bool ShardWarmupTimedOut
    {
        get;
        private set;
    }

    internal GreenfieldSqlApiFactory? SeedFactory
    {
        get;
        private set;
    }

    internal string? ExecutedRunId
    {
        get;
        private set;
    }

    public async Task InitializeAsync()
    {
        SqlReachable = AuditTrailCommitIntegrityIntegrationTestsHelpers.IsSqlReachable();

        if (!SqlReachable)
            return;

        if (GreenfieldSqlIntegrationWarmup.ShardWarmupTimedOut)
        {
            ShardWarmupTimedOut = true;
            return;
        }

        SeedFactory = new GreenfieldSqlApiFactory();

        using HttpClient client = SeedFactory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        try
        {
            ExecutedRunId =
                await ArchitectureRequestConcurrencyTestSupport.WarmGreenfieldSqlHostAndSeedExecutedRunAsync(client);
        }
        catch (WarmupTimedOutException)
        {
            GreenfieldSqlIntegrationWarmup.RecordShardWarmupTimedOut();
            ShardWarmupTimedOut = true;

            await SeedFactory.DisposeAsync();
            SeedFactory = null;
        }
    }

    public async Task DisposeAsync()
    {
        if (SeedFactory is not null)
            await SeedFactory.DisposeAsync();
    }
}
