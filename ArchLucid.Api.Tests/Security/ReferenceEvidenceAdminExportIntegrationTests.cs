using System.IO.Compression;
using System.Net;
using System.Net.Http.Json;

using ArchLucid.Application.Bootstrap;
using ArchLucid.Api.Tests.TestDtos;
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
    [SkippableFact]
    public async Task Reference_evidence_zip_uses_public_api_base_url_and_excludes_demo_when_includeDemo_false_sql_tb291()
    {
        Skip.IfNot(AuditTrailCommitIntegrityIntegrationTestsHelpers.IsSqlReachable(), "SQL integration env not configured");

        GreenfieldIntegrationTenantScope.Scope scope = GreenfieldIntegrationTenantScope.CreateUniqueScope();
        string testTag = "it-ref-evid-" + Guid.NewGuid().ToString("N");

        await using IdorGreenfieldSqlApiFactory factory = new();
        await GreenfieldIntegrationTenantScope.EnsureScopeAsync(factory.SqlConnectionString, scope);

        using (HttpClient primer = factory.CreateClient())
        {
            GreenfieldIntegrationTenantScope.WireScope(primer, scope);

            await GreenfieldSqlIntegrationWarmup.WarmArchitectureRequestHostOrSkipOnShardOverloadAsync(primer);
        }

        using HttpClient client = factory.CreateClient();
        GreenfieldIntegrationTenantScope.WireScope(client, scope);

        string requestId = testTag[..Math.Min(testTag.Length, 32)];
        HttpResponseMessage create = await PostArchitectureRequestAsync(client, TestRequestFactory.CreateArchitectureRequest(requestId));
        await create.EnsureSuccessForTestAsync();
        CreateRunResponseDto? created = await create.Content.ReadFromJsonAsync<CreateRunResponseDto>(ArchitectureRequestConcurrencyTestSupport.JsonOptions);
        string realRunId = created!.Run.RunId;

        await ArchitectureRequestConcurrencyTestSupport.PostExecuteWithGreenfieldTransientRetryAsync(client, realRunId);
        await ArchitectureRequestConcurrencyTestSupport.PostCommitWithGreenfieldTransientRetryAsync(client, realRunId);

        string readmeText = await GreenfieldCommittedRunReadinessPoll.WaitUntilReferenceEvidenceReadmeAnchorsRunAsync(
            client,
            realRunId);

        readmeText.Should().Contain(realRunId, because: "bundle must anchor on tenant real committed run");
        readmeText.Should().NotContain(ContosoRetailDemoIdentifiers.RunBaseline);
        readmeText.Should().NotContain(ContosoRetailDemoIdentifiers.RunHardened);

        HttpResponseMessage export = await client.GetAsync("/v1/admin/reference-evidence?includeDemo=false");
        export.StatusCode.Should().Be(HttpStatusCode.OK);

        byte[] zipBytes = await export.Content.ReadAsByteArrayAsync();
        zipBytes.Length.Should().BePositive();

        using MemoryStream ms = new(zipBytes);
        using ZipArchive zip = new(ms, ZipArchiveMode.Read, false);
        zip.Entries.Should().Contain(e => e.FullName == "pilot-run-deltas.json");
    }

    private static Task<HttpResponseMessage> PostArchitectureRequestAsync(HttpClient client, object body)
    {
        string idempotencyKey = "tb291-ref-" + Guid.NewGuid().ToString("N");
        return ArchitectureRequestConcurrencyTestSupport.PostSingleArchitectureRequestWithGreenfieldTransientRetryAsync(
            client,
            body,
            idempotencyKey);
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
