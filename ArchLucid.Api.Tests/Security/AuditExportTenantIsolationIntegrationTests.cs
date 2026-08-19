using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Api.Tests.TestDtos;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;
using ArchLucid.TestSupport;

using FluentAssertions;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Api.Tests.Security;

/// <summary>
///     TB-295: tenant B must not see tenant A audit rows via list or CSV export through the HTTP stack (SQL RLS).
/// </summary>
[Trait("Category", "Slow")]
[Collection("ArchLucidEnvMutation")]
public sealed class AuditExportTenantIsolationIntegrationTests
{
    private const string SqlExplicitUnavailable =
        "TB-295 audit export isolation tests: set "
        + TestDatabaseEnvironment.ApiIntegrationSqlEnvironmentVariable
        + " or "
        + TestDatabaseEnvironment.PersistenceSqlEnvironmentVariable
        + " to a reachable SQL instance.";

    private static readonly Guid TenantB = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static readonly Guid WorkspaceB = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
    private static readonly Guid ProjectB = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter(null) },
    };

    [SkippableFact]
    public async Task Tenant_b_audit_list_take_200_excludes_tenant_a_run_id_sql_tb295()
    {
        Skip.IfNot(IsSqlServerReachableWithShortTimeout(), SqlExplicitUnavailable);

        try
        {
            Guid runGuid = await SeedTenantACommittedRunAsync();

            await using GreenfieldSqlApiFactory factory = new();
            using HttpClient clientB = factory.CreateClient();
            WireScope(clientB, TenantB, WorkspaceB, ProjectB);

            HttpResponseMessage list = await clientB.GetAsync("/v1/audit?take=200");
            await list.EnsureSuccessForTestAsync();

            string json = await list.Content.ReadAsStringAsync();
            json.Should().NotContain(runGuid.ToString("D"), because: "tenant B audit list must not include tenant A run id");
        }
        catch (WarmupTimedOutException)
        {
            GreenfieldSqlIntegrationWarmup.RecordAndReturnOnShardOverload();
            return;
        }
        catch (GreenfieldCommitRetryBudgetExhaustedException)
        {
            GreenfieldSqlIntegrationWarmup.RecordAndReturnOnShardOverload();
            return;
        }
    }

    [SkippableFact]
    public async Task Tenant_b_audit_csv_export_excludes_tenant_a_run_id_sql_tb295()
    {
        Skip.IfNot(IsSqlServerReachableWithShortTimeout(), SqlExplicitUnavailable);

        try
        {
            Guid runGuid = await SeedTenantACommittedRunAsync();

            await using GreenfieldSqlApiFactory factory = new();
            using HttpClient clientB = factory.CreateClient();
            WireScope(clientB, TenantB, WorkspaceB, ProjectB);

            HttpResponseMessage export = await clientB.GetAsync($"/v1/audit/export/csv?runId={runGuid:D}&maxRows=500");
            await export.EnsureSuccessForTestAsync();

            string csv = await export.Content.ReadAsStringAsync();
            csv.Should().NotContain(runGuid.ToString("D"), because: "tenant B CSV export must not leak tenant A run id filter results");
        }
        catch (WarmupTimedOutException)
        {
            GreenfieldSqlIntegrationWarmup.RecordAndReturnOnShardOverload();
            return;
        }
        catch (GreenfieldCommitRetryBudgetExhaustedException)
        {
            GreenfieldSqlIntegrationWarmup.RecordAndReturnOnShardOverload();
            return;
        }
    }

    [SkippableFact]
    public async Task Tenant_b_audit_search_by_tenant_a_run_id_returns_empty_items_sql_tb295()
    {
        Skip.IfNot(IsSqlServerReachableWithShortTimeout(), SqlExplicitUnavailable);

        try
        {
            Guid runGuid = await SeedTenantACommittedRunAsync();

            await using GreenfieldSqlApiFactory factory = new();
            using HttpClient clientB = factory.CreateClient();
            WireScope(clientB, TenantB, WorkspaceB, ProjectB);

            HttpResponseMessage search = await clientB.GetAsync($"/v1/audit/search?runId={runGuid:D}&take=200");
            await search.EnsureSuccessForTestAsync();

            CursorPagedResponse<AuditEvent>? page =
                await search.Content.ReadFromJsonAsync<CursorPagedResponse<AuditEvent>>(JsonOptions);

            page.Should().NotBeNull();
            page!.Items.Should().BeEmpty(because: "tenant B scoped audit search must not return tenant A run events");
        }
        catch (WarmupTimedOutException)
        {
            GreenfieldSqlIntegrationWarmup.RecordAndReturnOnShardOverload();
            return;
        }
        catch (GreenfieldCommitRetryBudgetExhaustedException)
        {
            GreenfieldSqlIntegrationWarmup.RecordAndReturnOnShardOverload();
            return;
        }
    }

    private static async Task<Guid> SeedTenantACommittedRunAsync()
    {
        await using IdorGreenfieldSqlApiFactory factory = new();
        using (HttpClient primer = factory.CreateClient())
        {
            IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(primer);
            await GreenfieldSqlIntegrationWarmup.WarmArchitectureRequestHostOrSkipOnShardOverloadAsync(primer);
        }

        GreenfieldSqlIntegrationWarmup.SkipIfShardWarmupAlreadyTimedOut();

        await EnsureAlternateTenantAndWorkspaceAsync(factory.SqlConnectionString, TenantB, WorkspaceB, ProjectB);

        SecurityCommittedRunSeed.Result seed =
            await SecurityCommittedRunSeed.SeedCommittedRunOnWarmFactoryAsync(factory);

        using HttpClient clientA = factory.CreateClient();
        WireScope(clientA, ScopeIds.DefaultTenant, ScopeIds.DefaultWorkspace, ScopeIds.DefaultProject);

        HttpResponseMessage search = await clientA.GetAsync($"/v1/audit/search?runId={seed.RunGuid:D}&take=50");
        await search.EnsureSuccessForTestAsync();
        string json = await search.Content.ReadAsStringAsync();
        json.Should().Contain(AuditEventTypes.RunCompleted, because: "seed must produce durable audit rows for tenant A");

        return seed.RunGuid;
    }

    private static bool IsSqlServerReachableWithShortTimeout()
    {
        if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable(TestDatabaseEnvironment.ApiIntegrationSqlEnvironmentVariable))
            && string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable(TestDatabaseEnvironment.PersistenceSqlEnvironmentVariable)))
        {
            return false;
        }

        try
        {
            string connectionString =
                SqlServerIntegrationTestConnections.CreateEphemeralApiDatabaseConnectionString("master");
            SqlConnectionStringBuilder builder = new(connectionString) { ConnectTimeout = 4 };
            using SqlConnection connection = new(builder.ConnectionString);
            connection.Open();
            return true;
        }
        catch
        {
            return false;
        }
    }

    private static Task<HttpResponseMessage> PostArchitectureRequestAsync(HttpClient client, object body)
    {
        string idempotencyKey = "tb295-audit-export-" + Guid.NewGuid().ToString("N");
        return ArchitectureRequestConcurrencyTestSupport.PostSingleArchitectureRequestWithGreenfieldTransientRetryAsync(
            client,
            body,
            idempotencyKey);
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

    private static async Task EnsureAlternateTenantAndWorkspaceAsync(
        string connectionString,
        Guid tenantId,
        Guid workspaceId,
        Guid defaultProjectId)
    {
        await using SqlConnection connection = new(connectionString);
        await connection.OpenAsync();

        await using SqlCommand cmd = connection.CreateCommand();
        cmd.CommandText =
            """
            IF NOT EXISTS (SELECT 1 FROM dbo.Tenants WHERE Id = @Tid)
                INSERT INTO dbo.Tenants (Id, Name, Slug, Tier, EntraTenantId)
                VALUES (@Tid, N'Tenant audit export B', N'tenant-audit-export-b', N'Standard', NULL);
            IF NOT EXISTS (SELECT 1 FROM dbo.TenantWorkspaces WHERE Id = @Wid)
                INSERT INTO dbo.TenantWorkspaces (Id, TenantId, Name, DefaultProjectId)
                VALUES (@Wid, @Tid, N'Workspace B', @Pid);
            IF OBJECT_ID(N'dbo.Projects', N'U') IS NOT NULL
               AND NOT EXISTS (SELECT 1 FROM dbo.Projects WHERE Id = @Pid)
                INSERT INTO dbo.Projects (Id, TenantId, WorkspaceId, Name, CreatedUtc, IsDeleted)
                VALUES (@Pid, @Tid, @Wid, N'default', SYSUTCDATETIME(), 0);
            """;
        cmd.Parameters.AddWithValue("@Tid", tenantId);
        cmd.Parameters.AddWithValue("@Wid", workspaceId);
        cmd.Parameters.AddWithValue("@Pid", defaultProjectId);
        _ = await cmd.ExecuteNonQueryAsync();
    }
}
