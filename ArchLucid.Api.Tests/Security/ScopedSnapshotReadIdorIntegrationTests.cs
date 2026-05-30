using System.Net;
using System.Net.Http.Json;

using ArchLucid.Api.Tests.TestDtos;
using ArchLucid.Core.Scoping;
using ArchLucid.TestSupport;

using FluentAssertions;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Api.Tests.Security;

/// <summary>
///     TB-073: tenant B must not read tenant A run-scoped API payloads (SingleCatalog IDOR regression guard).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
[Collection("ArchLucidEnvMutation")]
public sealed class ScopedSnapshotReadIdorIntegrationTests
{
    private const string SqlExplicitUnavailable =
        "TB-073 snapshot IDOR tests: set "
        + TestDatabaseEnvironment.ApiIntegrationSqlEnvironmentVariable
        + " or "
        + TestDatabaseEnvironment.PersistenceSqlEnvironmentVariable
        + " to a reachable SQL instance.";

    private static readonly Guid TenantB = Guid.Parse("77777777-7777-7777-7777-777777777777");
    private static readonly Guid WorkspaceB = Guid.Parse("88888888-8888-8888-8888-888888888888");
    private static readonly Guid ProjectB = Guid.Parse("99999999-9999-9999-9999-999999999999");

    [SkippableFact]
    public async Task Tenant_b_cannot_list_tenant_a_run_findings_sql_tb073()
    {
        await AssertCrossTenantRouteDeniedAsync(
            "findings list",
            static (client, runId) => client.GetAsync($"/v1/architecture/run/{runId}/findings"));
    }

    [SkippableFact]
    public async Task Tenant_b_cannot_read_tenant_a_interactive_graph_sql_tb073()
    {
        await AssertCrossTenantRouteDeniedAsync(
            "interactive graph",
            static (client, runId) => client.GetAsync($"/v1/architecture/runs/{runId}/graph/interactive"));
    }

    [SkippableFact]
    public async Task Tenant_b_cannot_read_tenant_a_authority_run_detail_sql_tb073()
    {
        await AssertCrossTenantRouteDeniedAsync(
            "authority run detail",
            static (client, runId) => client.GetAsync($"/v1/runs/{runId}"));
    }

    [SkippableFact]
    public async Task Tenant_b_cannot_read_tenant_a_run_roi_estimate_sql_tb073()
    {
        await AssertCrossTenantRouteDeniedAsync(
            "run ROI estimate",
            static (client, runId) => client.GetAsync($"/v1/architecture/run/{runId}/roi"));
    }

    [SkippableFact]
    public async Task Tenant_b_cannot_read_tenant_a_pilot_run_deltas_sql_tb073()
    {
        await AssertCrossTenantRouteDeniedAsync(
            "pilot run deltas",
            static (client, runId) => client.GetAsync($"/v1/pilots/runs/{runId}/pilot-run-deltas"));
    }

    [SkippableFact]
    public async Task Tenant_b_cannot_list_tenant_a_run_artifacts_sql_tb073()
    {
        await AssertCrossTenantRouteDeniedAsync(
            "run artifact list",
            static (client, runId) => client.GetAsync($"/v1/runs/{runId}/artifacts"));
    }

    [SkippableFact]
    public async Task Tenant_b_cannot_download_tenant_a_run_artifact_bundle_sql_tb073()
    {
        await AssertCrossTenantRouteDeniedAsync(
            "run artifact bundle",
            static (client, runId) => client.GetAsync($"/v1/runs/{runId}/artifacts/bundle"));
    }

    [SkippableFact]
    public async Task Tenant_b_cannot_read_tenant_a_run_retrieval_grounding_sql_tb073()
    {
        await AssertCrossTenantRouteDeniedAsync(
            "retrieval grounding",
            static (client, runId) => client.GetAsync($"/v1/authority/runs/{runId}/retrieval-grounding"));
    }

    [SkippableFact]
    public async Task Tenant_b_cannot_read_tenant_a_authority_run_detail_v1_sql_tb073()
    {
        await AssertCrossTenantRouteDeniedAsync(
            "authority run detail v1",
            static (client, runId) => client.GetAsync($"/v1/authority/runs/{runId}"));
    }

    [SkippableFact]
    public async Task Tenant_b_cannot_read_tenant_a_explain_aggregate_sql_tb073()
    {
        await AssertCrossTenantRouteDeniedAsync(
            "explain aggregate",
            static (client, runId) => client.GetAsync($"/v1/explain/runs/{runId}/aggregate"));
    }

    [SkippableFact]
    public async Task Tenant_b_cannot_read_tenant_a_finding_llm_audit_sql_tb073()
    {
        await AssertCrossTenantRouteDeniedAsync(
            "finding llm audit",
            static (client, runId) =>
                client.GetAsync($"/v1/explain/runs/{runId}/findings/cross-tenant-idor-probe/llm-audit"));
    }

    private static async Task AssertCrossTenantRouteDeniedAsync(
        string routeFamily,
        Func<HttpClient, string, Task<HttpResponseMessage>> send)
    {
        Skip.IfNot(IsSqlServerReachableWithShortTimeout(), SqlExplicitUnavailable);

        await using GreenfieldSqlApiFactory factory = new();
        using (HttpClient primer = factory.CreateClient())
        {
            IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(primer);
            await ArchitectureRequestConcurrencyTestSupport.WarmGreenfieldSqlHostForArchitectureRequestTestsAsync(primer);
        }

        await EnsureAlternateTenantAndWorkspaceAsync(factory.SqlConnectionString, TenantB, WorkspaceB, ProjectB);

        CrossTenantRunSeed seed = await SeedTenantARunAsync(factory);

        using HttpClient clientB = factory.CreateClient();
        WireScope(clientB, TenantB, WorkspaceB, ProjectB);

        HttpResponseMessage response = await send(clientB, seed.RunId);

        response.StatusCode.Should().BeOneOf(
            [HttpStatusCode.NotFound, HttpStatusCode.Forbidden],
            because: $"{routeFamily} must not resolve for cross-tenant run id.");

        string body = await response.Content.ReadAsStringAsync();
        body.Should().NotContain(seed.RequestId, because: "cross-tenant denial must not leak tenant A request id.");
    }

    private static async Task<CrossTenantRunSeed> SeedTenantARunAsync(GreenfieldSqlApiFactory factory)
    {
        using HttpClient clientA = factory.CreateClient();
        WireScope(clientA, ScopeIds.DefaultTenant, ScopeIds.DefaultWorkspace, ScopeIds.DefaultProject);

        string requestId = "REQ-SNAPIDOR-" + Guid.NewGuid().ToString("N")[..12];
        HttpResponseMessage create = await PostArchitectureRequestAsync(
            clientA,
            TestRequestFactory.CreateArchitectureRequest(requestId));
        await create.EnsureSuccessForTestAsync();
        CreateRunResponseDto? created = await create.Content.ReadFromJsonAsync<CreateRunResponseDto>();

        return new CrossTenantRunSeed(created!.Run.RunId, requestId);
    }

    private sealed record CrossTenantRunSeed(string RunId, string RequestId);

    private static bool IsSqlServerReachableWithShortTimeout()
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
        string idempotencyKey = "tb073-snapshot-" + Guid.NewGuid().ToString("N");
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
                VALUES (@Tid, N'Tenant snapshot IDOR B', N'tenant-snap-b', N'Standard', NULL);
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
