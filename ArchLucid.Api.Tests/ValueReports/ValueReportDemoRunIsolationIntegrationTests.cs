using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Api.Tests.Security;
using ArchLucid.Api.Tests.TestDtos;
using ArchLucid.Application.Bootstrap;
using ArchLucid.Core.Scoping;
using ArchLucid.TestSupport;

using FluentAssertions;

namespace ArchLucid.Api.Tests.ValueReports;

/// <summary>
///     TB-294: sponsor/value artifacts for real tenant runs must not embed canonical showcase demo run ids.
/// </summary>
[Trait("Category", "Integration")]
[Collection("ArchLucidEnvMutation")]
public sealed class ValueReportDemoRunIsolationIntegrationTests
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter(null) },
    };

    [SkippableFact]
    public async Task First_value_report_for_real_run_does_not_reference_showcase_demo_run_ids_sql_tb294()
    {
        Skip.IfNot(AuditTrailCommitIntegrityIntegrationTestsHelpers.IsSqlReachable(), "SQL integration env not configured");

        await using GreenfieldSqlApiFactory factory = new();
        using (HttpClient primer = factory.CreateClient())
        {
            IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(primer);
            await ArchitectureRequestConcurrencyTestSupport.WarmGreenfieldSqlHostForArchitectureRequestTestsAsync(
                primer,
                includePostCreateRunWarmup: false);
        }

        using HttpClient client = factory.CreateClient();
        WireScope(client, ScopeIds.DefaultTenant, ScopeIds.DefaultWorkspace, ScopeIds.DefaultProject);

        string requestId = "REQ-VAL-RPT-" + Guid.NewGuid().ToString("N")[..12];
        HttpResponseMessage create = await PostArchitectureRequestAsync(client, TestRequestFactory.CreateArchitectureRequest(requestId));
        await create.EnsureSuccessForTestAsync();
        CreateRunResponseDto? created = await create.Content.ReadFromJsonAsync<CreateRunResponseDto>(JsonOptions);
        string realRunId = created!.Run.RunId;

        HttpResponseMessage execute = await client.PostAsync($"/v1/architecture/run/{realRunId}/execute", null);
        await execute.EnsureSuccessForTestAsync();
        HttpResponseMessage commit = await client.PostAsync($"/v1/architecture/run/{realRunId}/commit", null);
        commit.StatusCode.Should().Be(HttpStatusCode.OK);

        HttpResponseMessage report = await client.GetAsync($"/v1/pilots/runs/{realRunId}/first-value-report");
        report.StatusCode.Should().Be(HttpStatusCode.OK);
        string markdown = await report.Content.ReadAsStringAsync();

        markdown.Should().NotContain(ContosoRetailDemoIdentifiers.RunBaseline);
        markdown.Should().NotContain(ContosoRetailDemoIdentifiers.RunHardened);
        markdown.Should().NotContain(ContosoRetailDemoIdentifiers.AuthorityRunBaselineId.ToString("D"));
        markdown.Should().NotContain(ContosoRetailDemoIdentifiers.AuthorityRunHardenedId.ToString("D"));
    }

    private static Task<HttpResponseMessage> PostArchitectureRequestAsync(HttpClient client, object body)
    {
        string idempotencyKey = "tb294-val-" + Guid.NewGuid().ToString("N");
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
