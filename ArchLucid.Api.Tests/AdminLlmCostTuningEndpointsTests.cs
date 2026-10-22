using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

using ArchLucid.Api.Tests.Security;
using ArchLucid.Application.Agents;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>HTTP coverage for <c>GET /v1/admin/custom-handlers</c> and <c>POST /v1/admin/llm-cost-tuning</c>.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
public sealed class AdminLlmCostTuningEndpointsTests(ApiKeyReaderAndAdminArchLucidApiFactory factory)
    : IClassFixture<ApiKeyReaderAndAdminArchLucidApiFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    [SkippableFact]
    public async Task Reader_key_cannot_GET_custom_handlers_returns_403()
    {
        using HttpClient client = factory.CreateClient();
        client.DefaultRequestHeaders.Add(
            "X-Api-Key",
            ApiKeyReaderAndAdminArchLucidApiFactory.IntegrationTestReaderApiKey);
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using HttpResponseMessage response = await client.GetAsync("/v1/admin/custom-handlers");

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [SkippableFact]
    public async Task Admin_GET_custom_handlers_returns_200_with_array()
    {
        using HttpClient client = factory.CreateClient();
        client.DefaultRequestHeaders.Add(
            "X-Api-Key",
            ApiKeyReaderAndAdminArchLucidApiFactory.IntegrationTestAdminApiKey);
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using HttpResponseMessage response = await client.GetAsync("/v1/admin/custom-handlers");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        string json = await response.Content.ReadAsStringAsync();
        JsonSerializer.Deserialize<List<RegisteredAgentHandlerInfo>>(json, JsonOptions).Should().NotBeNull();
    }

    [SkippableFact]
    public async Task Admin_POST_llm_cost_tuning_in_memory_host_returns_501()
    {
        using HttpClient client = factory.CreateClient();
        client.DefaultRequestHeaders.Add(
            "X-Api-Key",
            ApiKeyReaderAndAdminArchLucidApiFactory.IntegrationTestAdminApiKey);
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        LlmCostTuningRequest body = new() { InputUsdPerMillionTokens = 1m, OutputUsdPerMillionTokens = 2m };

        using HttpResponseMessage response =
            await client.PostAsJsonAsync("/v1/admin/llm-cost-tuning", body, JsonOptions);

        response.StatusCode.Should().Be(HttpStatusCode.NotImplemented);
    }
}
