using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

using ArchLucid.Api.Tests.Security;
using ArchLucid.Core.Configuration.Summary;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
public sealed class AdminAgentOutputQualityGateModeEndpointTests(ApiKeyReaderAndAdminArchLucidApiFactory factory)
    : IClassFixture<ApiKeyReaderAndAdminArchLucidApiFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    [SkippableFact]
    public async Task Put_then_get_returns_tenant_override()
    {
        using HttpClient client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Api-Key", ApiKeyReaderAndAdminArchLucidApiFactory.IntegrationTestAdminApiKey);
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using HttpResponseMessage put = await client.PutAsJsonAsync(
            "/v1/admin/settings/agent-output-quality-gate-mode",
            new TenantAgentOutputQualityGateModeUpdateRequest { Mode = "PilotStrict" });

        put.StatusCode.Should().Be(HttpStatusCode.OK);
        TenantAgentOutputQualityGateModeResponse? putBody =
            await put.Content.ReadFromJsonAsync<TenantAgentOutputQualityGateModeResponse>(JsonOptions);

        putBody.Should().NotBeNull();
        putBody!.EffectiveMode.Should().Be("PilotStrict");
        putBody.Source.Should().Be("TenantOverride");

        using HttpResponseMessage get = await client.GetAsync("/v1/admin/settings/agent-output-quality-gate-mode");
        get.StatusCode.Should().Be(HttpStatusCode.OK);
        TenantAgentOutputQualityGateModeResponse? getBody =
            await get.Content.ReadFromJsonAsync<TenantAgentOutputQualityGateModeResponse>(JsonOptions);

        getBody.Should().NotBeNull();
        getBody!.EffectiveMode.Should().Be("PilotStrict");
        getBody.Source.Should().Be("TenantOverride");
    }

    [SkippableFact]
    public async Task Delete_clears_override()
    {
        using HttpClient client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Api-Key", ApiKeyReaderAndAdminArchLucidApiFactory.IntegrationTestAdminApiKey);
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using HttpResponseMessage put = await client.PutAsJsonAsync(
            "/v1/admin/settings/agent-output-quality-gate-mode",
            new TenantAgentOutputQualityGateModeUpdateRequest { Mode = "WarnOnly" });

        put.EnsureSuccessStatusCode();

        using HttpResponseMessage delete = await client.DeleteAsync("/v1/admin/settings/agent-output-quality-gate-mode");
        delete.StatusCode.Should().Be(HttpStatusCode.OK);
        TenantAgentOutputQualityGateModeResponse? body =
            await delete.Content.ReadFromJsonAsync<TenantAgentOutputQualityGateModeResponse>(JsonOptions);

        body.Should().NotBeNull();
        body!.Source.Should().Be("HostDefault");
    }
}
