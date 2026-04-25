using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

using ArchLucid.Api.Tests.TestDtos;
using ArchLucid.Core.Scoping;
using ArchLucid.TestSupport;

using FluentAssertions;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Api.Tests.Security;

/// <summary>
///     Smoke test: with SQL + RLS session context, runs created under tenant A are invisible to API calls scoped as
///     tenant B (headers <c>x-tenant-id</c> / workspace / project).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
public sealed class TenantIsolationSmokeTests
{
    private const string SqlUnavailable =
        "SQL + RLS tenant tests need SQL Server. Set "
        + TestDatabaseEnvironment.ApiIntegrationSqlEnvironmentVariable
        + " or "
        + TestDatabaseEnvironment.PersistenceSqlEnvironmentVariable
        + " (see docs/BUILD.md), or use Windows with LocalDB.";

    // Fixed alternate scope: distinct from <see cref="ScopeIds" /> defaults (tenant A in tests).
    private static readonly Guid TenantB = Guid.Parse("44444444-4444-4444-4444-444444444444");
    private static readonly Guid WorkspaceB = Guid.Parse("55555555-5555-5555-5555-555555555555");
    private static readonly Guid ProjectB = Guid.Parse("66666666-6666-6666-6666-666666666666");

    private static bool IsSqlServerConfiguredForApiIntegration()
    {
        if (!string.IsNullOrWhiteSpace(
                Environment.GetEnvironmentVariable(TestDatabaseEnvironment.ApiIntegrationSqlEnvironmentVariable)))
            return true;

        if (!string.IsNullOrWhiteSpace(
                Environment.GetEnvironmentVariable(TestDatabaseEnvironment.PersistenceSqlEnvironmentVariable)))
            return true;

        return OperatingSystem.IsWindows();
    }

    [SkippableFact]
    public async Task Tenant_b_cannot_see_tenant_a_run_sql_rls()
    {
        Skip.IfNot(IsSqlServerConfiguredForApiIntegration(), SqlUnavailable);

        await using SqlRlsTenantIsolationApiFactory factory = new();
        using (HttpClient primer = factory.CreateClient())
        {
            IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(primer);
            // DbUp + first SQL queries can return 503 until the authority pipeline is warm; avoid relying on a single
            // probe shape so CI stays stable.
            await WarmListRunsPathAsync(primer);
        }

        await EnsureAlternateTenantAndWorkspaceAsync(factory.SqlConnectionString, TenantB, WorkspaceB, ProjectB);

        using HttpClient clientA = factory.CreateClient();
        WireScope(clientA, ScopeIds.DefaultTenant, ScopeIds.DefaultWorkspace, ScopeIds.DefaultProject);

        string requestId = "REQ-TNTISO-" + Guid.NewGuid().ToString("N")[..12];
        HttpResponseMessage create = await PostArchitectureRequestWithTransientRetryAsync(
            clientA,
            TestRequestFactory.CreateArchitectureRequest(requestId));
        create.EnsureSuccessStatusCode();
        CreateRunResponseDto? created = await create.Content.ReadFromJsonAsync<CreateRunResponseDto>();
        string runId = created!.Run.RunId;

        using HttpClient clientB = factory.CreateClient();
        WireScope(clientB, TenantB, WorkspaceB, ProjectB);

        HttpResponseMessage getOther = await clientB.GetAsync($"/v1/architecture/run/{runId}");
        getOther.StatusCode.Should().Be(HttpStatusCode.NotFound, "RLS + scope must hide other-tenant runs.");

        HttpResponseMessage listOther = await clientB.GetAsync("/v1/architecture/runs?limit=200");
        listOther.EnsureSuccessStatusCode();
        string listJson = await listOther.Content.ReadAsStringAsync();
        ListContainsRunId(listJson, runId).Should().BeFalse("list must not return runs from another tenant.");

        HttpResponseMessage getOwn = await clientA.GetAsync($"/v1/architecture/run/{runId}");
        getOwn.EnsureSuccessStatusCode();
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

    private static bool ListContainsRunId(string json, string runId)
    {
        using JsonDocument doc = JsonDocument.Parse(json);
        foreach (JsonElement row in doc.RootElement.EnumerateArray())
        {
            if (row.TryGetProperty("runId", out JsonElement id) && string.Equals(
                    id.GetString(),
                    runId,
                    StringComparison.Ordinal))
                return true;
        }

        return false;
    }

    /// <summary>Inserts a second registry row so <c>CommercialTenantTierFilter</c> allows tenant B’s HTTP scope.</summary>
    private static async Task EnsureAlternateTenantAndWorkspaceAsync(
        string connectionString,
        Guid tenantId,
        Guid workspaceId,
        Guid defaultProjectId)
    {
        await using SqlConnection connection = new(connectionString);
        await connection.OpenAsync();
        await using (SqlCommand bypass = connection.CreateCommand())
        {
            bypass.CommandText = "EXEC sp_set_session_context @k, @v, @read_only;";
            bypass.Parameters.AddWithValue("@k", "al_rls_bypass");
            bypass.Parameters.AddWithValue("@v", 1);
            bypass.Parameters.AddWithValue("@read_only", 0);
            await bypass.ExecuteNonQueryAsync();
        }

        await using SqlCommand cmd = connection.CreateCommand();
        cmd.CommandText =
            """
            IF NOT EXISTS (SELECT 1 FROM dbo.Tenants WHERE Id = @Tid)
                INSERT INTO dbo.Tenants (Id, Name, Slug, Tier, EntraTenantId)
                VALUES (@Tid, N'Tenant isolation B', N'tenant-iso-b', N'Standard', NULL);
            IF NOT EXISTS (SELECT 1 FROM dbo.TenantWorkspaces WHERE Id = @Wid)
                INSERT INTO dbo.TenantWorkspaces (Id, TenantId, Name, DefaultProjectId)
                VALUES (@Wid, @Tid, N'Workspace B', @Pid);
            """;
        cmd.Parameters.AddWithValue("@Tid", tenantId);
        cmd.Parameters.AddWithValue("@Wid", workspaceId);
        cmd.Parameters.AddWithValue("@Pid", defaultProjectId);
        _ = await cmd.ExecuteNonQueryAsync();
    }

    private static async Task WarmListRunsPathAsync(HttpClient client)
    {
        for (int attempt = 0; attempt < 40; attempt++)
        {
            using HttpResponseMessage response = await client.GetAsync("/v1/architecture/runs?limit=1");
            if (response.StatusCode != HttpStatusCode.ServiceUnavailable)
                return;

            await Task.Delay(1000);
        }
    }

    private static async Task<HttpResponseMessage> PostArchitectureRequestWithTransientRetryAsync(
        HttpClient client,
        object body)
    {
        for (int attempt = 0; attempt < 10; attempt++)
        {
            HttpResponseMessage response = await client
                .PostAsJsonAsync("/v1/architecture/request", body);
            if (response.StatusCode != HttpStatusCode.ServiceUnavailable)
                return response;

            response.Dispose();
            await Task.Delay(750 * (attempt + 1));
        }

        return await client.PostAsJsonAsync("/v1/architecture/request", body);
    }
}
