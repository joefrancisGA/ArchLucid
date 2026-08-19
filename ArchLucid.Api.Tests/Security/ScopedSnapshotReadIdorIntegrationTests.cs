using System.IO.Compression;
using System.Net;
using System.Net.Http.Headers;
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
[Trait("Category", "Slow")]
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

    /// <summary>Public Azure Blob host shape; passes BE-034 sync guard before run scope is evaluated.</summary>
    private const string PlaceholderAzureBlobSasUrl =
        "https://acct.blob.core.windows.net/exports/archlucid.zip?sv=2022-11-02&ss=b&srt=sco&sp=w&se=2099-01-01T00:00:00Z&sig=placeholder";

    [SkippableFact]
    public async Task Tenant_b_cannot_list_tenant_a_run_findings_sql_tb073()
    {
        await AssertCrossTenantRouteDeniedAsync(
            "findings list",
            static (client, runId) => client.GetAsync($"/v1/architecture/review/{runId}/findings"));
    }

    [SkippableFact]
    public async Task Tenant_b_cannot_read_tenant_a_interactive_graph_sql_tb073()
    {
        await AssertCrossTenantRouteDeniedAsync(
            "interactive graph",
            static (client, runId) => client.GetAsync($"/v1/architecture/reviews/{runId}/graph/interactive"));
    }

    [SkippableFact]
    public async Task Tenant_b_cannot_read_tenant_a_authority_run_detail_sql_tb073()
    {
        await AssertCrossTenantRouteDeniedAsync(
            "authority run detail",
            static (client, runId) => client.GetAsync($"/v1/architecture/review/{runId}"));
    }

    [SkippableFact]
    public async Task Tenant_b_cannot_read_tenant_a_run_roi_estimate_sql_tb073()
    {
        await AssertCrossTenantRouteDeniedAsync(
            "run ROI estimate",
            static (client, runId) => client.GetAsync($"/v1/architecture/review/{runId}/roi"));
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
            static (client, runId) => client.GetAsync($"/v1/architecture/reviews/{runId}/artifacts"));
    }

    [SkippableFact]
    public async Task Tenant_b_cannot_download_tenant_a_run_artifact_export_zip_sql_tb274()
    {
        await AssertCrossTenantRouteDeniedAsync(
            "artifact run export zip",
            static (client, runId) => client.GetAsync($"/v1/artifacts/reviews/{runId}/export"));
    }

    [SkippableFact]
    public async Task Tenant_b_cannot_push_tenant_a_run_export_to_blob_sql_tb274()
    {
        await AssertCrossTenantRouteDeniedAsync(
            "artifact run export blob push",
            static (client, runId) =>
                client.PostAsJsonAsync(
                    $"/v1/artifacts/reviews/{runId}/export/push",
                    new { destinationSasUrl = PlaceholderAzureBlobSasUrl }));
    }

    [SkippableFact]
    public async Task Tenant_b_cannot_generate_tenant_a_run_analysis_report_sql_tb274()
    {
        await AssertCrossTenantRouteDeniedAsync(
            "run analysis report",
            static (client, runId) =>
                client.PostAsJsonAsync($"/v1/architecture/review/{runId}/analysis-report", new { }));
    }

    [SkippableFact]
    public async Task Tenant_b_cannot_bulk_upload_tenant_a_run_evidence_sql_tb274()
    {
        await AssertCrossTenantRouteDeniedAsync(
            "run evidence bulk upload",
            static async (client, runId) =>
            {
                using MultipartFormDataContent form = new();
                ByteArrayContent empty = new([]);

                empty.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("text/plain");
                form.Add(empty, "files", "empty.txt");

                return await client.PostAsync($"/v1/architecture/review/{runId}/evidence/bulk", form);
            });
    }

    [SkippableFact]
    public async Task Tenant_b_cannot_create_tenant_a_terraform_pr_sql_tb274()
    {
        await AssertCrossTenantRouteDeniedAsync(
            "terraform advisory PR",
            static (client, runId) =>
                client.PostAsync($"/v1/artifacts/reviews/{runId}/terraform-pr", content: null));
    }

    [SkippableFact]
    public async Task Tenant_b_cannot_upload_extractor_to_tenant_a_run_sql_tb274()
    {
        await AssertCrossTenantRouteDeniedAsync(
            "azure extractor upload with foreign runId",
            static async (client, runId) =>
            {
                using MultipartFormDataContent form = BuildExtractorUploadForm(BuildValidExtractorZip());
                return await client.PostAsync($"/v1/azure-extractor/upload?runId={runId}", form);
            },
            allowIngestRejection: true);
    }

    [SkippableFact]
    public async Task Tenant_b_cannot_download_tenant_a_extractor_package_sql_tb274()
    {
        Skip.IfNot(IsSqlServerReachableWithShortTimeout(), SqlExplicitUnavailable);

        await using GreenfieldSqlApiFactory factory = new();
        using (HttpClient primer = factory.CreateClient())
        {
            IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(primer);
            await GreenfieldSqlIntegrationWarmup.WarmArchitectureRequestHostOrSkipOnShardOverloadAsync(primer);
        }

        await EnsureAlternateTenantAndWorkspaceAsync(factory.SqlConnectionString, TenantB, WorkspaceB, ProjectB);

        Guid packageId;
        using (HttpClient clientA = factory.CreateClient())
        {
            WireScope(clientA, ScopeIds.DefaultTenant, ScopeIds.DefaultWorkspace, ScopeIds.DefaultProject);
            using MultipartFormDataContent form = BuildExtractorUploadForm(BuildValidExtractorZip());
            HttpResponseMessage upload = await clientA.PostAsync("/v1/azure-extractor/upload", form);
            await upload.EnsureSuccessForTestAsync();
            using System.Text.Json.JsonDocument doc =
                System.Text.Json.JsonDocument.Parse(await upload.Content.ReadAsStringAsync());
            packageId = doc.RootElement.GetProperty("packageId").GetGuid();
        }

        using HttpClient clientB = factory.CreateClient();
        WireScope(clientB, TenantB, WorkspaceB, ProjectB);

        HttpResponseMessage response =
            await clientB.GetAsync($"/v1/azure-extractor/packages/{packageId:D}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound, because: "foreign package id must not resolve in tenant B scope.");
    }

    [SkippableFact]
    public async Task Tenant_b_cannot_download_tenant_a_run_artifact_bundle_sql_tb073()
    {
        await AssertCrossTenantRouteDeniedAsync(
            "run artifact bundle",
            static (client, runId) => client.GetAsync($"/v1/architecture/reviews/{runId}/artifacts/bundle"));
    }

    [SkippableFact]
    public async Task Tenant_b_cannot_read_tenant_a_run_retrieval_grounding_sql_tb073()
    {
        await AssertCrossTenantRouteDeniedAsync(
            "retrieval grounding",
            static (client, runId) => client.GetAsync($"/v1/authority/reviews/{runId}/retrieval-grounding"));
    }

    [SkippableFact]
    public async Task Tenant_b_cannot_read_tenant_a_authority_run_detail_v1_sql_tb073()
    {
        await AssertCrossTenantRouteDeniedAsync(
            "authority run detail v1",
            static (client, runId) => client.GetAsync($"/v1/authority/reviews/{runId}"));
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

    [SkippableFact]
    public async Task Tenant_a_scope_only_executive_summary_is_not_forbidden_sql_tb280()
    {
        await AssertMatchingTenantRouteNotForbiddenAsync(
            "Sponsor report",
            static (client, _) => client.GetAsync("/v1/reports/sponsor-report"));
    }

    [SkippableFact]
    public async Task Tenant_a_scope_only_reference_evidence_is_not_forbidden_sql_tb279()
    {
        await AssertMatchingTenantRouteNotForbiddenAsync(
            "reference evidence export",
            static (client, _) =>
                client.GetAsync("/v1/admin/reference-evidence?includeDemo=false"));
    }

    [SkippableFact]
    public async Task Tenant_a_scope_only_metering_summary_is_not_forbidden_sql_tb279()
    {
        DateTimeOffset start = DateTimeOffset.UtcNow.AddDays(-7);
        DateTimeOffset end = DateTimeOffset.UtcNow;

        await AssertMatchingTenantRouteNotForbiddenAsync(
            "metering summary",
            (client, _) =>
                client.GetAsync(
                    $"/v1/admin/metering/summary?periodStart={Uri.EscapeDataString(start.ToString("O"))}&periodEnd={Uri.EscapeDataString(end.ToString("O"))}"));
    }

    [SkippableFact]
    public async Task Tenant_a_scope_only_value_report_generate_is_not_forbidden_sql_tb281()
    {
        await AssertMatchingTenantRouteNotForbiddenAsync(
            "value report generate",
            static (client, _) =>
                client.PostAsync("/v1/value-report/generate", content: null));
    }

    [SkippableFact]
    public async Task Tenant_b_cannot_read_tenant_a_catalog_migration_default_scope_sql_tb274()
    {
        await AssertCrossTenantTenantRouteDeniedAsync(
            "catalog migration default scope",
            static (client, tenantId) =>
                client.GetAsync($"/v1/admin/tenants/{tenantId:D}/catalog-migration/default-scope"));
    }

    [SkippableFact]
    public async Task Tenant_b_cannot_generate_tenant_a_value_report_sql_tb274()
    {
        await AssertCrossTenantTenantRouteDeniedAsync(
            "value report generate",
            static (client, tenantId) =>
                client.PostAsync($"/v1/value-report/{tenantId:D}/generate", content: null));
    }

    [SkippableFact]
    public async Task Export_blob_push_with_internal_ip_returns_bad_request_before_queue_sql_tb296()
    {
        Skip.IfNot(IsSqlServerReachableWithShortTimeout(), SqlExplicitUnavailable);

        CommittedRunSeed? seed = await TrySeedTenantACommittedRunOrSkipOnShardOverloadAsync();

        if (seed is null)
            return;

        await using GreenfieldSqlApiFactory factory = new();
        using HttpClient client = factory.CreateClient();
        WireScope(client, ScopeIds.DefaultTenant, ScopeIds.DefaultWorkspace, ScopeIds.DefaultProject);

        HttpResponseMessage response = await client.PostAsJsonAsync(
            $"/v1/artifacts/reviews/{seed.RunId}/export/push",
            new { destinationSasUrl = "https://127.0.0.1/evil/archlucid.zip?sv=2022-11-02&ss=b&srt=sco&sp=w&sig=x" });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        string body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("private", because: "SSRF policy must reject loopback destinations at the API boundary");
    }

    [SkippableFact]
    public async Task Export_blob_push_with_non_blob_host_returns_bad_request_sql_tb296()
    {
        Skip.IfNot(IsSqlServerReachableWithShortTimeout(), SqlExplicitUnavailable);

        CommittedRunSeed? seed = await TrySeedTenantACommittedRunOrSkipOnShardOverloadAsync();

        if (seed is null)
            return;

        await using GreenfieldSqlApiFactory factory = new();
        using HttpClient client = factory.CreateClient();
        WireScope(client, ScopeIds.DefaultTenant, ScopeIds.DefaultWorkspace, ScopeIds.DefaultProject);

        HttpResponseMessage response = await client.PostAsJsonAsync(
            $"/v1/artifacts/reviews/{seed.RunId}/export/push",
            new { destinationSasUrl = "https://evil.example.com/exports/archlucid.zip?sig=x" });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [SkippableFact]
    public async Task Export_blob_push_with_azure_blob_host_returns_accepted_sql_tb296()
    {
        Skip.IfNot(IsSqlServerReachableWithShortTimeout(), SqlExplicitUnavailable);

        await using IdorGreenfieldSqlApiFactory factory = new();
        using (HttpClient primer = factory.CreateClient())
        {
            IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(primer);
            await GreenfieldSqlIntegrationWarmup.WarmArchitectureRequestHostOrSkipOnShardOverloadAsync(primer);
        }

        SecurityCommittedRunSeed.Result? seed =
            await TrySeedCommittedRunOnWarmFactoryOrSkipOnShardOverloadAsync(factory);

        if (seed is null)
            return;

        using HttpClient client = factory.CreateClient();
        WireScope(client, ScopeIds.DefaultTenant, ScopeIds.DefaultWorkspace, ScopeIds.DefaultProject);

        HttpResponseMessage response = await client.PostAsJsonAsync(
            $"/v1/artifacts/reviews/{seed.RunId}/export/push",
            new { destinationSasUrl = PlaceholderAzureBlobSasUrl });

        response.StatusCode.Should().Be(HttpStatusCode.Accepted);
    }

    [SkippableFact]
    public async Task Matching_tenant_committed_run_artifact_list_and_download_return_bytes_sql_tb298()
    {
        Skip.IfNot(IsSqlServerReachableWithShortTimeout(), SqlExplicitUnavailable);

        await using IdorGreenfieldSqlApiFactory factory = new();
        using (HttpClient primer = factory.CreateClient())
        {
            IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(primer);
            await GreenfieldSqlIntegrationWarmup.WarmArchitectureRequestHostOrSkipOnShardOverloadAsync(primer);
        }

        SecurityCommittedRunSeed.Result? seed =
            await TrySeedCommittedRunOnWarmFactoryOrSkipOnShardOverloadAsync(factory);

        if (seed is null)
            return;

        using HttpClient client = factory.CreateClient();
        WireScope(client, ScopeIds.DefaultTenant, ScopeIds.DefaultWorkspace, ScopeIds.DefaultProject);

        HttpResponseMessage list = await client.GetAsync($"/v1/architecture/reviews/{seed.RunId}/artifacts");
        await list.EnsureSuccessForTestAsync();

        string listJson = await list.Content.ReadAsStringAsync();
        using System.Text.Json.JsonDocument doc = System.Text.Json.JsonDocument.Parse(listJson);
        System.Text.Json.JsonElement root = doc.RootElement;

        System.Text.Json.JsonElement artifactsElement = root.ValueKind == System.Text.Json.JsonValueKind.Array
            ? root
            : root.GetProperty("artifacts");

        artifactsElement.GetArrayLength().Should().BeGreaterThan(0, because: "committed run must expose synthesized artifacts");

        Guid artifactId = artifactsElement[0].GetProperty("artifactId").GetGuid();

        HttpResponseMessage download =
            await client.GetAsync($"/v1/architecture/reviews/{seed.RunId}/artifacts/{artifactId:D}");

        await download.EnsureSuccessForTestAsync();
        download.Content.Headers.ContentType?.MediaType.Should().NotBeNullOrWhiteSpace();

        byte[] bytes = await download.Content.ReadAsByteArrayAsync();
        bytes.Length.Should().BeGreaterThan(0, because: "artifact download must return non-empty bytes for matching tenant");
    }

    private static async Task AssertMatchingTenantRouteNotForbiddenAsync(
        string routeFamily,
        Func<HttpClient, Guid, Task<HttpResponseMessage>> send)
    {
        Skip.IfNot(IsSqlServerReachableWithShortTimeout(), SqlExplicitUnavailable);

        await using GreenfieldSqlApiFactory factory = new();
        using (HttpClient primer = factory.CreateClient())
        {
            IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(primer);
            await GreenfieldSqlIntegrationWarmup.WarmArchitectureRequestHostOrSkipOnShardOverloadAsync(primer);
        }

        using HttpClient clientA = factory.CreateClient();
        WireScope(clientA, ScopeIds.DefaultTenant, ScopeIds.DefaultWorkspace, ScopeIds.DefaultProject);

        HttpResponseMessage response = await send(clientA, ScopeIds.DefaultTenant);

        response.StatusCode.Should().NotBe(HttpStatusCode.Forbidden, because: $"{routeFamily} must not 403 for matching tenant route id.");
    }

    private static async Task AssertCrossTenantTenantRouteDeniedAsync(
        string routeFamily,
        Func<HttpClient, Guid, Task<HttpResponseMessage>> send)
    {
        Skip.IfNot(IsSqlServerReachableWithShortTimeout(), SqlExplicitUnavailable);

        await using GreenfieldSqlApiFactory factory = new();
        using (HttpClient primer = factory.CreateClient())
        {
            IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(primer);
            await GreenfieldSqlIntegrationWarmup.WarmArchitectureRequestHostOrSkipOnShardOverloadAsync(primer);
        }

        await EnsureAlternateTenantAndWorkspaceAsync(factory.SqlConnectionString, TenantB, WorkspaceB, ProjectB);

        using HttpClient clientB = factory.CreateClient();
        WireScope(clientB, TenantB, WorkspaceB, ProjectB);

        HttpResponseMessage response = await send(clientB, ScopeIds.DefaultTenant);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden, because: $"{routeFamily} must not resolve for cross-tenant route id.");
    }

    private static async Task AssertCrossTenantRouteDeniedAsync(
        string routeFamily,
        Func<HttpClient, string, Task<HttpResponseMessage>> send,
        bool allowIngestRejection = false)
    {
        Skip.IfNot(IsSqlServerReachableWithShortTimeout(), SqlExplicitUnavailable);

        await using GreenfieldSqlApiFactory factory = new();
        using (HttpClient primer = factory.CreateClient())
        {
            IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(primer);
            await GreenfieldSqlIntegrationWarmup.WarmArchitectureRequestHostOrSkipOnShardOverloadAsync(primer);
        }

        await EnsureAlternateTenantAndWorkspaceAsync(factory.SqlConnectionString, TenantB, WorkspaceB, ProjectB);

        CrossTenantRunSeed seed = await SeedTenantARunAsync(factory);

        using HttpClient clientB = factory.CreateClient();
        WireScope(clientB, TenantB, WorkspaceB, ProjectB);

        HttpResponseMessage response = await send(clientB, seed.RunId);

        HttpStatusCode[] allowed =
            allowIngestRejection
                ?
                [
                    HttpStatusCode.NotFound,
                    HttpStatusCode.Forbidden,
                    HttpStatusCode.BadRequest,
                    HttpStatusCode.UnprocessableEntity
                ]
                : [HttpStatusCode.NotFound, HttpStatusCode.Forbidden];

        response.StatusCode.Should().BeOneOf(
            allowed,
            because: $"{routeFamily} must not resolve for cross-tenant run id.");

        string body = await response.Content.ReadAsStringAsync();
        body.Should().NotContain(seed.RequestId, because: "cross-tenant denial must not leak tenant A request id.");
    }

    private static MultipartFormDataContent BuildExtractorUploadForm(byte[] zipBody)
    {
        ByteArrayContent content = new(zipBody);
        content.Headers.ContentType = new MediaTypeHeaderValue("application/zip");
        MultipartFormDataContent form = new();
        form.Add(content, name: "file", fileName: "azure-package.zip");

        return form;
    }

    private static byte[] BuildValidExtractorZip()
    {
        using MemoryStream ms = new();

        using (ZipArchive zip = new(ms, ZipArchiveMode.Create, leaveOpen: true))
        {
            ZipArchiveEntry manifest = zip.CreateEntry("manifest.json");
            using (StreamWriter sw = new(manifest.Open()))
            {
                sw.Write(
                    """
                    {"schemaVersion":1,"scriptVersion":"1.0.0-tests","collectionTimestamp":"2026-05-06T12:00:00Z",
                    "subscriptionId":"aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
                    "scope":"/subscriptions/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
                    "switchesUsed":[],"azModuleVersion":"0.0.0-test"}
                    """);
            }

            ZipArchiveEntry resources = zip.CreateEntry("resources.json");
            using (StreamWriter rw = new(resources.Open()))
            {
                rw.Write("[]");
            }
        }

        return ms.ToArray();
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

    private sealed record CommittedRunSeed(string RunId);

    private static async Task<CommittedRunSeed?> TrySeedTenantACommittedRunOrSkipOnShardOverloadAsync()
    {
        try
        {
            SecurityCommittedRunSeed.Result seed = await SecurityCommittedRunSeed.SeedDefaultScopeCommittedRunAsync();

            return new CommittedRunSeed(seed.RunId);
        }
        catch (GreenfieldCommitRetryBudgetExhaustedException)
        {
            GreenfieldSqlIntegrationWarmup.RecordAndReturnOnShardOverload();

            return null;
        }
    }

    private static async Task<SecurityCommittedRunSeed.Result?> TrySeedCommittedRunOnWarmFactoryOrSkipOnShardOverloadAsync(
        GreenfieldSqlApiFactory factory)
    {
        try
        {
            return await SecurityCommittedRunSeed.SeedCommittedRunOnWarmFactoryAsync(factory);
        }
        catch (GreenfieldCommitRetryBudgetExhaustedException)
        {
            GreenfieldSqlIntegrationWarmup.RecordAndReturnOnShardOverload();

            return null;
        }
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
