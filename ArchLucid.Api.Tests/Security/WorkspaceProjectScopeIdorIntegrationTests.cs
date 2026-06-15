using System.Net;
using System.Net.Http.Json;

using ArchLucid.Api.Tests.TestDtos;
using ArchLucid.Core.Scoping;
using ArchLucid.TestSupport;

using FluentAssertions;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Api.Tests.Security;

/// <summary>
///     Same-tenant workspace/project IDOR regression guard for high-value read/export routes.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
[Collection("ArchLucidEnvMutation")]
public sealed class WorkspaceProjectScopeIdorIntegrationTests
{
    private const string SqlExplicitUnavailable =
        "Workspace/project IDOR tests: set "
        + TestDatabaseEnvironment.ApiIntegrationSqlEnvironmentVariable
        + " or "
        + TestDatabaseEnvironment.PersistenceSqlEnvironmentVariable
        + " to a reachable SQL instance.";

    private static readonly Guid AlternateWorkspace = Guid.Parse("44444444-4444-4444-4444-444444444444");
    private static readonly Guid AlternateProject = Guid.Parse("55555555-5555-5555-5555-555555555555");

    [SkippableFact]
    public async Task Wrong_workspace_cannot_read_run_detail_sql()
    {
        await AssertWrongWorkspaceRouteDeniedAsync(
            "authority run detail",
            static (client, runId) => client.GetAsync($"/v1/runs/{runId}"));
    }

    [SkippableFact]
    public async Task Wrong_workspace_cannot_list_run_artifacts_sql()
    {
        await AssertWrongWorkspaceRouteDeniedAsync(
            "run artifact list",
            static (client, runId) => client.GetAsync($"/v1/runs/{runId}/artifacts"));
    }

    [SkippableFact]
    public async Task Wrong_workspace_cannot_read_run_roi_estimate_sql()
    {
        await AssertWrongWorkspaceRouteDeniedAsync(
            "run ROI estimate",
            static (client, runId) => client.GetAsync($"/v1/architecture/run/{runId}/roi"));
    }

    [SkippableFact]
    public async Task Wrong_workspace_cannot_read_pilot_run_deltas_sql()
    {
        await AssertWrongWorkspaceRouteDeniedAsync(
            "pilot run deltas",
            static (client, runId) => client.GetAsync($"/v1/pilots/runs/{runId}/pilot-run-deltas"));
    }

    [SkippableFact]
    public async Task Wrong_workspace_cannot_read_explain_aggregate_sql()
    {
        await AssertWrongWorkspaceRouteDeniedAsync(
            "explain aggregate",
            static (client, runId) => client.GetAsync($"/v1/explain/runs/{runId}/aggregate"));
    }

    [SkippableFact]
    public async Task Wrong_workspace_cannot_download_run_export_zip_sql()
    {
        await AssertWrongWorkspaceRouteDeniedAsync(
            "artifact run export zip",
            static (client, runId) => client.GetAsync($"/v1/artifacts/runs/{runId}/export"));
    }

    private static async Task AssertWrongWorkspaceRouteDeniedAsync(
        string routeFamily,
        Func<HttpClient, string, Task<HttpResponseMessage>> send)
    {
        Skip.IfNot(IsSqlServerReachableWithShortTimeout(), SqlExplicitUnavailable);

        await using GreenfieldSqlApiFactory factory = new();
        using (HttpClient primer = factory.CreateClient())
        {
            IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(primer);
            await GreenfieldSqlIntegrationWarmup.WarmArchitectureRequestHostOrSkipOnShardOverloadAsync(primer);
        }

        await EnsureAlternateWorkspaceInSameTenantAsync(factory.SqlConnectionString);

        ScopedRunSeed seed = await SeedDefaultWorkspaceRunAsync(factory);

        using HttpClient wrongScopeClient = factory.CreateClient();
        WireScope(wrongScopeClient, ScopeIds.DefaultTenant, AlternateWorkspace, AlternateProject);

        HttpResponseMessage response = await send(wrongScopeClient, seed.RunId);

        response.StatusCode.Should().BeOneOf(
            [HttpStatusCode.NotFound, HttpStatusCode.Forbidden],
            because: $"{routeFamily} must not resolve for same-tenant wrong workspace/project scope.");

        string body = await response.Content.ReadAsStringAsync();
        body.Should().NotContain(seed.RequestId, because: "wrong-scope denial must not leak request id.");
    }

    private sealed record ScopedRunSeed(string RunId, string RequestId);

    private static async Task<ScopedRunSeed> SeedDefaultWorkspaceRunAsync(GreenfieldSqlApiFactory factory)
    {
        using HttpClient client = factory.CreateClient();
        WireScope(client, ScopeIds.DefaultTenant, ScopeIds.DefaultWorkspace, ScopeIds.DefaultProject);

        string requestId = "REQ-WSPROJ-IDOR-" + Guid.NewGuid().ToString("N")[..12];
        HttpResponseMessage create = await PostArchitectureRequestAsync(
            client,
            TestRequestFactory.CreateArchitectureRequest(requestId));
        await create.EnsureSuccessForTestAsync();
        CreateRunResponseDto? created = await create.Content.ReadFromJsonAsync<CreateRunResponseDto>();

        return new ScopedRunSeed(created!.Run.RunId, requestId);
    }

    private static Task<HttpResponseMessage> PostArchitectureRequestAsync(HttpClient client, object body)
    {
        string idempotencyKey = "wsproj-idor-" + Guid.NewGuid().ToString("N");

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

    private static async Task EnsureAlternateWorkspaceInSameTenantAsync(string connectionString)
    {
        await using SqlConnection connection = new(connectionString);
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
}
