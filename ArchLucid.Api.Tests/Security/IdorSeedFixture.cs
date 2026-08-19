using System.Net.Http.Json;

using ArchLucid.Api.Tests.TestDtos;
using ArchLucid.Core.Scoping;
using ArchLucid.TestSupport;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Api.Tests.Security;

/// <summary>
///     One greenfield SQL catalog, one warmup, and one seeded run shared by all six
///     <see cref="WorkspaceProjectScopeIdorIntegrationTests" /> cases.
/// </summary>
/// <remarks>
///     Before this fixture existed each test case created its own
///     <see cref="GreenfieldSqlApiFactory" />, ran the full DbUp + readiness + warmup + seed
///     sequence, and disposed the catalog — six cold DbUp cycles and twelve
///     <c>POST /v1/architecture/request</c> calls per shard. Under CI SQL pressure the
///     <see cref="AuthorityPipelineWorkHostedService" /> background poller competes with those
///     create-run pipelines, causing <c>Execution Timeout Expired</c> on the outbox CTE query
///     and eventually exhausting the twenty-attempt retry budget (~46 min, CI #2235 shard 5/6).
///
///     The fixture uses <see cref="IdorGreenfieldSqlApiFactory" /> which sets
///     <c>Hosting:Role=Api</c> to suppress the outbox background workers, then warms and seeds
///     exactly once. All six assertions reuse <see cref="SeedRunId" /> and
///     <see cref="SeedRequestId" />.
/// </remarks>
public sealed class IdorSeedFixture : IAsyncLifetime
{
    private static readonly Guid AlternateWorkspace = Guid.Parse("44444444-4444-4444-4444-444444444444");
    private static readonly Guid AlternateProject = Guid.Parse("55555555-5555-5555-5555-555555555555");

    internal bool SqlReachable { get; private set; }

    internal bool ShardWarmupTimedOut { get; private set; }

    internal IdorGreenfieldSqlApiFactory? Factory { get; private set; }

    /// <summary>RunId scoped to <see cref="ScopeIds.DefaultWorkspace" /> for all IDOR probes.</summary>
    internal string? SeedRunId { get; private set; }

    /// <summary>Architecture request id embedded in the seed run; checked in anti-leak body assertions.</summary>
    internal string? SeedRequestId { get; private set; }

    /// <inheritdoc />
    public async Task InitializeAsync()
    {
        SqlReachable = IsSqlReachable();

        if (!SqlReachable)
            return;

        if (GreenfieldSqlIntegrationWarmup.ShardWarmupTimedOut)
        {
            ShardWarmupTimedOut = true;
            return;
        }

        Factory = new IdorGreenfieldSqlApiFactory();

        try
        {
            using HttpClient warmupClient = Factory.CreateClient();
            IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(warmupClient);

            // Call WarmGreenfieldSqlHostForArchitectureRequestTestsAsync directly (not the
            // WarmArchitectureRequestHostOrSkipOnShardOverloadAsync helper) because the
            // helper calls Skip.IfNot which throws SkipException — invalid in IAsyncLifetime.
            await ArchitectureRequestConcurrencyTestSupport.WarmGreenfieldSqlHostForArchitectureRequestTestsAsync(
                warmupClient);

            await EnsureAlternateWorkspaceAsync();

            (SeedRunId, SeedRequestId) = await SeedDefaultWorkspaceRunAsync();
        }
        catch (WarmupTimedOutException)
        {
            GreenfieldSqlIntegrationWarmup.RecordShardWarmupTimedOut();
            ShardWarmupTimedOut = true;
            await TeardownFactoryAsync();
        }
        catch (Exception ex)
        {
            await TeardownFactoryAsync();
            throw new InvalidOperationException(
                "IdorSeedFixture setup failed. IDOR tests cannot run. See inner exception for details.",
                ex);
        }
    }

    /// <inheritdoc />
    public async Task DisposeAsync()
    {
        await TeardownFactoryAsync();
    }

    private async Task<(string RunId, string RequestId)> SeedDefaultWorkspaceRunAsync()
    {
        using HttpClient client = Factory!.CreateClient();
        WireScope(client, ScopeIds.DefaultTenant, ScopeIds.DefaultWorkspace, ScopeIds.DefaultProject);

        string requestId = "REQ-WSPROJ-IDOR-" + Guid.NewGuid().ToString("N")[..12];
        string idempotencyKey = "wsproj-idor-seed-" + Guid.NewGuid().ToString("N");
        object body = TestRequestFactory.CreateArchitectureRequest(requestId);

        using HttpResponseMessage response =
            await ArchitectureRequestConcurrencyTestSupport.PostSingleArchitectureRequestWithGreenfieldTransientRetryAsync(
                client,
                body,
                idempotencyKey);

        await response.EnsureSuccessForTestAsync();

        CreateRunResponseDto? created =
            await response.Content.ReadFromJsonAsync<CreateRunResponseDto>(
                ArchitectureRequestConcurrencyTestSupport.JsonOptions);

        return (created!.Run.RunId, requestId);
    }

    private async Task EnsureAlternateWorkspaceAsync()
    {
        await using SqlConnection connection = new(Factory!.SqlConnectionString);
        await connection.OpenAsync();

        await using SqlCommand cmd = connection.CreateCommand();
        cmd.CommandText =
            """
            IF NOT EXISTS (SELECT 1 FROM dbo.TenantWorkspaces WHERE Id = @Wid)
                INSERT INTO dbo.TenantWorkspaces (Id, TenantId, Name, DefaultProjectId)
                VALUES (@Wid, @Tid, N'Workspace scope IDOR alt', @Pid);
            IF OBJECT_ID(N'dbo.Projects', N'U') IS NOT NULL
               AND NOT EXISTS (SELECT 1 FROM dbo.Projects WHERE Id = @Pid)
                INSERT INTO dbo.Projects (Id, TenantId, WorkspaceId, Name, CreatedUtc, IsDeleted)
                VALUES (@Pid, @Tid, @Wid, N'alt-default', SYSUTCDATETIME(), 0);
            """;
        cmd.Parameters.AddWithValue("@Tid", ScopeIds.DefaultTenant);
        cmd.Parameters.AddWithValue("@Wid", AlternateWorkspace);
        cmd.Parameters.AddWithValue("@Pid", AlternateProject);
        _ = await cmd.ExecuteNonQueryAsync();
    }

    private async Task TeardownFactoryAsync()
    {
        if (Factory is not null)
        {
            await Factory.DisposeAsync();
            Factory = null;
        }
    }

    private static void WireScope(HttpClient client, Guid tenantId, Guid workspaceId, Guid projectId)
    {
        _ = client.DefaultRequestHeaders.TryAddWithoutValidation("x-tenant-id", tenantId.ToString("D"));
        _ = client.DefaultRequestHeaders.TryAddWithoutValidation("x-workspace-id", workspaceId.ToString("D"));
        _ = client.DefaultRequestHeaders.TryAddWithoutValidation("x-project-id", projectId.ToString("D"));
    }

    private static bool IsSqlReachable()
    {
        if (string.IsNullOrWhiteSpace(
                Environment.GetEnvironmentVariable(TestDatabaseEnvironment.ApiIntegrationSqlEnvironmentVariable))
            && string.IsNullOrWhiteSpace(
                Environment.GetEnvironmentVariable(TestDatabaseEnvironment.PersistenceSqlEnvironmentVariable)))
        {
            return false;
        }

        try
        {
            string cs = SqlServerIntegrationTestConnections.CreateEphemeralApiDatabaseConnectionString("master");
            SqlConnectionStringBuilder builder = new(cs) { ConnectTimeout = 4 };
            using SqlConnection connection = new(builder.ConnectionString);
            connection.Open();
            return true;
        }
        catch
        {
            return false;
        }
    }
}
