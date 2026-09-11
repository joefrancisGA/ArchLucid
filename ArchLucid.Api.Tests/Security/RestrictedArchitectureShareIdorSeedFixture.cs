using System.Net.Http.Json;

using ArchLucid.Api.Tests.TestDtos;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.TestSupport;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Api.Tests.Security;

/// <summary>
///     Seeds one restricted architecture and one seeded run for AS-091 share IDOR integration tests.
/// </summary>
public sealed class RestrictedArchitectureShareIdorSeedFixture : IAsyncLifetime
{
    private const string SqlExplicitUnavailable =
        "Restricted architecture share IDOR tests: SQL integration env not configured.";

    internal static readonly Guid OwnerUserId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    internal static readonly Guid UnsharedUserId = Guid.Parse("22222222-2222-2222-2222-222222222222");

    internal const string SecretDisplayName = "SECRET-RESTRICTED-AS091-IDOR";

    internal bool SqlReachable { get; private set; }

    internal bool ShardWarmupTimedOut { get; private set; }

    internal IdorGreenfieldSqlApiFactory? Factory { get; private set; }

    internal Guid RestrictedArchitectureId { get; private set; }

    internal string? SeedRunId { get; private set; }

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

            await ArchitectureRequestConcurrencyTestSupport.WarmGreenfieldSqlHostForArchitectureRequestTestsAsync(
                warmupClient);

            (SeedRunId, RestrictedArchitectureId) = await SeedRestrictedArchitectureAsync();
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
                "RestrictedArchitectureShareIdorSeedFixture setup failed. See inner exception for details.",
                ex);
        }
    }

    public async Task DisposeAsync()
    {
        await TeardownFactoryAsync();
    }

    private async Task<(string RunId, Guid ArchitectureId)> SeedRestrictedArchitectureAsync()
    {
        using HttpClient client = Factory!.CreateClient();
        WireScope(client, ScopeIds.DefaultTenant, ScopeIds.DefaultWorkspace, ScopeIds.DefaultProject);

        string requestId = "REQ-RESTRICT-IDOR-" + Guid.NewGuid().ToString("N")[..12];
        string idempotencyKey = "restrict-idor-seed-" + Guid.NewGuid().ToString("N");
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

        string runId = created!.Run.RunId;

        await using SqlConnection connection = new(Factory.SqlConnectionString);
        await connection.OpenAsync();

        Guid architectureId = await ReadArchitectureIdForRunAsync(connection, runId);

        await SeedPlatformUsersAndRestrictedArchitectureAsync(connection, architectureId);

        return (runId, architectureId);
    }

    private static async Task<Guid> ReadArchitectureIdForRunAsync(SqlConnection connection, string runId)
    {
        await using SqlCommand cmd = connection.CreateCommand();
        cmd.CommandText =
            """
            SELECT ArchitectureId
            FROM dbo.Runs
            WHERE RunId = @RunId
              AND ArchitectureId IS NOT NULL;
            """;
        cmd.Parameters.AddWithValue("@RunId", Guid.Parse(runId));

        object? scalar = await cmd.ExecuteScalarAsync();

        if (scalar is null or DBNull)
            throw new InvalidOperationException($"Seed run '{runId}' did not resolve an ArchitectureId.");

        return (Guid)scalar;
    }

    private static async Task SeedPlatformUsersAndRestrictedArchitectureAsync(
        SqlConnection connection,
        Guid architectureId)
    {
        await using SqlCommand cmd = connection.CreateCommand();
        cmd.CommandText =
            """
            IF NOT EXISTS (SELECT 1 FROM dbo.PlatformUsers WHERE Id = @OwnerId)
                INSERT INTO dbo.PlatformUsers (Id, PrimaryEmail, DisplayName, Status, CreatedUtc, UpdatedUtc)
                VALUES (@OwnerId, N'owner-as091@example.com', N'Owner AS091', N'Active', SYSUTCDATETIME(), SYSUTCDATETIME());

            IF NOT EXISTS (SELECT 1 FROM dbo.PlatformUsers WHERE Id = @UnsharedId)
                INSERT INTO dbo.PlatformUsers (Id, PrimaryEmail, DisplayName, Status, CreatedUtc, UpdatedUtc)
                VALUES (@UnsharedId, N'unshared-as091@example.com', N'Unshared AS091', N'Active', SYSUTCDATETIME(), SYSUTCDATETIME());

            UPDATE dbo.Architectures
            SET RestrictToShares = 1,
                DisplayName = @SecretName,
                UpdatedUtc = SYSUTCDATETIME()
            WHERE ArchitectureId = @ArchitectureId;

            IF NOT EXISTS (
                SELECT 1 FROM dbo.ArchitectureShares
                WHERE ArchitectureId = @ArchitectureId AND UserId = @OwnerId)
            BEGIN
                INSERT INTO dbo.ArchitectureShares
                (
                    ArchitectureId, UserId, TenantId, WorkspaceId, ScopeProjectId,
                    Role, GrantedBy, GrantedUtc
                )
                VALUES
                (
                    @ArchitectureId, @OwnerId, @TenantId, @WorkspaceId, @ProjectId,
                    @AdminRole, N'as091-seed', SYSUTCDATETIME()
                );
            END
            """;
        cmd.Parameters.AddWithValue("@ArchitectureId", architectureId);
        cmd.Parameters.AddWithValue("@OwnerId", OwnerUserId);
        cmd.Parameters.AddWithValue("@UnsharedId", UnsharedUserId);
        cmd.Parameters.AddWithValue("@TenantId", ScopeIds.DefaultTenant);
        cmd.Parameters.AddWithValue("@WorkspaceId", ScopeIds.DefaultWorkspace);
        cmd.Parameters.AddWithValue("@ProjectId", ScopeIds.DefaultProject);
        cmd.Parameters.AddWithValue("@SecretName", SecretDisplayName);
        cmd.Parameters.AddWithValue("@AdminRole", ArchitectureShareRoles.Admin);
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
        client.DefaultRequestHeaders.Remove("x-tenant-id");
        client.DefaultRequestHeaders.Remove("x-workspace-id");
        client.DefaultRequestHeaders.Remove("x-project-id");
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
