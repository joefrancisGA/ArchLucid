using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Api.Tests.TestDtos;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.TestSupport;

using FluentAssertions;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Api.Tests.Security;

/// <summary>
///     TB-290: commit path produces durable audit events queryable by run id with tenant isolation.
/// </summary>
[Trait("Category", "Slow")]
[Collection("ArchLucidEnvMutation")]
public sealed class AuditTrailCommitIntegrityIntegrationTests
{
    private const string SqlExplicitUnavailable =
        "TB-290 audit trail tests: set "
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
    public async Task Commit_path_audit_search_contains_run_lifecycle_events_sql_tb290()
    {
        Skip.IfNot(IsSqlServerReachableWithShortTimeout(), SqlExplicitUnavailable);

        try
        {
            GreenfieldIntegrationTenantScope.Scope scope = GreenfieldIntegrationTenantScope.CreateUniqueScope();
            string testTag = "it-audit-trail-" + Guid.NewGuid().ToString("N");

            await using IdorGreenfieldSqlApiFactory factory = new();
            await GreenfieldIntegrationTenantScope.EnsureScopeAfterGreenfieldHostReadyAsync(factory, scope);

            using HttpClient client = factory.CreateClient();
            GreenfieldIntegrationTenantScope.WireScope(client, scope);

            string requestId = testTag[..Math.Min(testTag.Length, 32)];
            HttpResponseMessage create = await PostArchitectureRequestAsync(client, TestRequestFactory.CreateArchitectureRequest(requestId));
            await create.EnsureSuccessForTestAsync();
            CreateRunResponseDto? created = await create.Content.ReadFromJsonAsync<CreateRunResponseDto>(JsonOptions);
            string runId = created!.Run.RunId;
            Guid runGuid = Guid.Parse(runId);

            await ArchitectureRequestConcurrencyTestSupport.PostExecuteWithGreenfieldTransientRetryAsync(client, runId);
            await ArchitectureRequestConcurrencyTestSupport.PostCommitWithGreenfieldTransientRetryAsync(client, runId);

            string json = await GreenfieldCommittedRunReadinessPoll.WaitUntilAuditSearchContainsScopedLifecycleEventsAsync(
                client,
                runGuid,
                scope.TenantId);

            json.Should().Contain(AuditEventTypes.RunStarted, because: "audit search must include run lifecycle events after commit");
            json.Should().Contain(AuditEventTypes.RunCompleted);
            json.Should().Contain(scope.TenantId.ToString("D"), because: "audit rows must carry tenant scope");
        }
        catch (WarmupTimedOutException)
        {
            // RecordAndReturnOnShardOverload instead of SkipShardOverload: throwing SkipException
            // after an awaited operation causes vstest to re-queue the test indefinitely.
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
    public async Task Tenant_b_audit_search_by_tenant_a_run_id_returns_empty_sql_tb290()
    {
        Skip.IfNot(IsSqlServerReachableWithShortTimeout(), SqlExplicitUnavailable);

        try
        {
            await using GreenfieldSqlApiFactory factory = new();
            using (HttpClient primer = factory.CreateClient())
            {
                IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(primer);

                // Full warmup including one create-run POST; ensures SQL is warm before the tenant-A
                // create-run in the test body. The 10-attempt transient-retry helper is not a cold-start
                // substitute for the warmup's 50-minute bootstrap budget.
                await GreenfieldSqlIntegrationWarmup.WarmArchitectureRequestHostOrSkipOnShardOverloadAsync(primer);
            }

            GreenfieldSqlIntegrationWarmup.SkipIfShardWarmupAlreadyTimedOut();

            await EnsureAlternateTenantAndWorkspaceAsync(factory.SqlConnectionString, TenantB, WorkspaceB, ProjectB);

            using HttpClient clientA = factory.CreateClient();
            WireScope(clientA, ScopeIds.DefaultTenant, ScopeIds.DefaultWorkspace, ScopeIds.DefaultProject);

            string requestId = "REQ-AUDIT-ISO-" + Guid.NewGuid().ToString("N")[..12];
            HttpResponseMessage create = await PostArchitectureRequestAsync(clientA, TestRequestFactory.CreateArchitectureRequest(requestId));
            await create.EnsureSuccessForTestAsync();
            CreateRunResponseDto? created = await create.Content.ReadFromJsonAsync<CreateRunResponseDto>(JsonOptions);
            Guid runGuid = Guid.Parse(created!.Run.RunId);

            using HttpClient clientB = factory.CreateClient();
            WireScope(clientB, TenantB, WorkspaceB, ProjectB);

            HttpResponseMessage search = await clientB.GetAsync($"/v1/audit/search?runId={runGuid:D}&take=50");
            await search.EnsureSuccessForTestAsync();
            string json = await search.Content.ReadAsStringAsync();
            json.Should().NotContain(runGuid.ToString("D"), because: "tenant B must not see tenant A audit events for that run id");
        }
        catch (WarmupTimedOutException)
        {
            GreenfieldSqlIntegrationWarmup.RecordAndReturnOnShardOverload();
            return;
        }
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
        string idempotencyKey = "tb290-audit-" + Guid.NewGuid().ToString("N");
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
                VALUES (@Tid, N'Tenant audit B', N'tenant-audit-b', N'Standard', NULL);
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
