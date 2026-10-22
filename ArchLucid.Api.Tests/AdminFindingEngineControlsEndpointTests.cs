using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

using ArchLucid.Api.Tests.Security;
using ArchLucid.Core.Configuration.Summary;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
public sealed class AdminFindingEngineControlsEndpointTests(ApiKeyReaderAndAdminArchLucidApiFactory factory)
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
            "/v1/admin/settings/finding-engine-controls",
            new TenantFindingEngineControlsUpdateRequest
            {
                EnableLlmJudge = true,
                EnableLlmJudgeForEngineFindings = true,
                PortfolioRecurrenceEnabled = true,
            });

        put.StatusCode.Should().Be(HttpStatusCode.OK);
        TenantFindingEngineControlsResponse? putBody =
            await put.Content.ReadFromJsonAsync<TenantFindingEngineControlsResponse>(JsonOptions);

        putBody.Should().NotBeNull();
        putBody!.EffectiveEnableLlmJudge.Should().BeTrue();
        putBody.EffectiveEnableLlmJudgeForEngineFindings.Should().BeTrue();
        putBody.EffectivePortfolioRecurrenceEnabled.Should().BeTrue();
        putBody.EnableLlmJudgeOverridden.Should().BeTrue();

        using HttpResponseMessage get = await client.GetAsync("/v1/admin/settings/finding-engine-controls");
        get.StatusCode.Should().Be(HttpStatusCode.OK);
        TenantFindingEngineControlsResponse? getBody =
            await get.Content.ReadFromJsonAsync<TenantFindingEngineControlsResponse>(JsonOptions);

        getBody.Should().NotBeNull();
        getBody!.EffectiveEnableLlmJudge.Should().BeTrue();
        getBody.EnableLlmJudgeOverridden.Should().BeTrue();
    }

    [SkippableFact]
    public async Task Delete_clears_overrides()
    {
        using HttpClient client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Api-Key", ApiKeyReaderAndAdminArchLucidApiFactory.IntegrationTestAdminApiKey);
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using HttpResponseMessage put = await client.PutAsJsonAsync(
            "/v1/admin/settings/finding-engine-controls",
            new TenantFindingEngineControlsUpdateRequest
            {
                EnableLlmJudge = false,
                EnableLlmJudgeForEngineFindings = false,
                PortfolioRecurrenceEnabled = false,
            });

        put.EnsureSuccessStatusCode();

        using HttpResponseMessage delete = await client.DeleteAsync("/v1/admin/settings/finding-engine-controls");
        delete.StatusCode.Should().Be(HttpStatusCode.OK);
        TenantFindingEngineControlsResponse? body =
            await delete.Content.ReadFromJsonAsync<TenantFindingEngineControlsResponse>(JsonOptions);

        body.Should().NotBeNull();
        body!.EnableLlmJudgeOverridden.Should().BeFalse();
        body.EnableLlmJudgeForEngineFindingsOverridden.Should().BeFalse();
        body.PortfolioRecurrenceEnabledOverridden.Should().BeFalse();
    }
}
