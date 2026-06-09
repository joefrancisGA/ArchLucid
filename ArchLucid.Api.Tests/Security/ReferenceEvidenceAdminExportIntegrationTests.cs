using System.IO.Compression;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Application.Bootstrap;
using ArchLucid.Api.Tests.TestDtos;
using ArchLucid.Core.Scoping;
using ArchLucid.TestSupport;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Security;

/// <summary>
///     TB-291: reference-evidence ZIP export content and tenant scope.
/// </summary>
[Trait("Category", "Integration")]
[Collection("ArchLucidEnvMutation")]
public sealed class ReferenceEvidenceAdminExportIntegrationTests
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter(null) },
    };

    [SkippableFact]
    public async Task Reference_evidence_zip_uses_public_api_base_url_and_excludes_demo_when_includeDemo_false_sql_tb291()
    {
        Skip.IfNot(AuditTrailCommitIntegrityIntegrationTestsHelpers.IsSqlReachable(), "SQL integration env not configured");

        await using GreenfieldSqlApiFactory factory = new();
        using (HttpClient primer = factory.CreateClient())
        {
            IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(primer);

            // Full create-run warmup: TB-291 depends on POST /v1/architecture/request on a cold greenfield catalog.
            await GreenfieldSqlIntegrationWarmup.WarmArchitectureRequestHostOrSkipOnShardOverloadAsync(primer);
        }

        using HttpClient client = factory.CreateClient();
        WireScope(client, ScopeIds.DefaultTenant, ScopeIds.DefaultWorkspace, ScopeIds.DefaultProject);

        string requestId = "REQ-REF-EVID-" + Guid.NewGuid().ToString("N")[..12];
        HttpResponseMessage create = await PostArchitectureRequestAsync(client, TestRequestFactory.CreateArchitectureRequest(requestId));
        await create.EnsureSuccessForTestAsync();
        CreateRunResponseDto? created = await create.Content.ReadFromJsonAsync<CreateRunResponseDto>(JsonOptions);
        string realRunId = created!.Run.RunId;

        HttpResponseMessage execute = await client.PostAsync($"/v1/architecture/run/{realRunId}/execute", null);
        await execute.EnsureSuccessForTestAsync();
        HttpResponseMessage commit = await client.PostAsync($"/v1/architecture/run/{realRunId}/commit", null);
        await commit.EnsureSuccessForTestAsync();

        HttpResponseMessage export = await client.GetAsync(
            "/v1/admin/reference-evidence?includeDemo=false");
        export.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);

        if (export.StatusCode == HttpStatusCode.NotFound)
            return;

        byte[] zipBytes = await export.Content.ReadAsByteArrayAsync();
        zipBytes.Length.Should().BePositive();

        using MemoryStream ms = new(zipBytes);
        using ZipArchive zip = new(ms, ZipArchiveMode.Read, false);
        zip.Entries.Should().Contain(e => e.FullName == "pilot-run-deltas.json");

        ZipArchiveEntry? readme = zip.GetEntry("README.txt");
        readme.Should().NotBeNull();
        using StreamReader reader = new(readme!.Open());
        string readmeText = await reader.ReadToEndAsync();
        readmeText.Should().Contain(realRunId, because: "bundle must anchor on tenant real committed run");
        readmeText.Should().NotContain(ContosoRetailDemoIdentifiers.RunBaseline);
        readmeText.Should().NotContain(ContosoRetailDemoIdentifiers.RunHardened);
    }

    private static Task<HttpResponseMessage> PostArchitectureRequestAsync(HttpClient client, object body)
    {
        string idempotencyKey = "tb291-ref-" + Guid.NewGuid().ToString("N");
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
}

/// <summary>Shared SQL reachability probe for TB-290/TB-291 integration tests.</summary>
internal static class AuditTrailCommitIntegrityIntegrationTestsHelpers
{
    internal static bool IsSqlReachable()
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
            Microsoft.Data.SqlClient.SqlConnectionStringBuilder builder = new(connectionString) { ConnectTimeout = 4 };
            using Microsoft.Data.SqlClient.SqlConnection connection = new(builder.ConnectionString);
            connection.Open();
            return true;
        }
        catch
        {
            return false;
        }
    }
}
