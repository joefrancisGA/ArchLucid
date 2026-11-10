using System.Net;
using System.Net.Http.Json;

using ArchLucid.Api.Tests.Security;
using ArchLucid.Core.Configuration.Summary;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
public sealed class AdminAgentOutputQualityGateModeEndpointTests(ApiKeyReaderAndAdminArchLucidApiFactory factory)
    : AdminApiKeyIntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task Put_then_get_returns_tenant_override()
    {
        using HttpClient client = CreateAdminClient();

        using HttpResponseMessage put = await client.PutAsJsonAsync(
            "/v1/admin/settings/agent-output-quality-gate-mode",
            new TenantAgentOutputQualityGateModeUpdateRequest { Mode = "PilotStrict" });

        put.StatusCode.Should().Be(HttpStatusCode.OK);
        TenantAgentOutputQualityGateModeResponse putBody =
            await put.ReadJsonForTestAsync<TenantAgentOutputQualityGateModeResponse>(JsonOptions);

        putBody.EffectiveMode.Should().Be("PilotStrict");
        putBody.Source.Should().Be("TenantOverride");

        using HttpResponseMessage get = await client.GetAsync("/v1/admin/settings/agent-output-quality-gate-mode");
        TenantAgentOutputQualityGateModeResponse getBody =
            await get.ReadJsonForTestAsync<TenantAgentOutputQualityGateModeResponse>(JsonOptions);

        getBody.EffectiveMode.Should().Be("PilotStrict");
        getBody.Source.Should().Be("TenantOverride");
    }

    [SkippableFact]
    public async Task Delete_clears_override()
    {
        using HttpClient client = CreateAdminClient();

        using HttpResponseMessage put = await client.PutAsJsonAsync(
            "/v1/admin/settings/agent-output-quality-gate-mode",
            new TenantAgentOutputQualityGateModeUpdateRequest { Mode = "WarnOnly" });

        await put.EnsureSuccessForTestAsync();

        using HttpResponseMessage delete = await client.DeleteAsync("/v1/admin/settings/agent-output-quality-gate-mode");
        delete.StatusCode.Should().Be(HttpStatusCode.OK);
        TenantAgentOutputQualityGateModeResponse body =
            await delete.ReadJsonForTestAsync<TenantAgentOutputQualityGateModeResponse>(JsonOptions);

        body.Source.Should().Be("HostDefault");
    }
}
