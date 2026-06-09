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

        SeedFactory = new GreenfieldSqlApiFactory();

        using HttpClient client = SeedFactory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);
        ExecutedRunId = await ArchitectureRequestConcurrencyTestSupport.WarmGreenfieldSqlHostAndSeedExecutedRunAsync(client);
    }

    public async Task DisposeAsync()
    {
        if (SeedFactory is not null)
            await SeedFactory.DisposeAsync();
    }
}
