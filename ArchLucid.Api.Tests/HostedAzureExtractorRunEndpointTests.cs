using System.Net;
using System.Text;

using ArchLucid.Api.Tests.Security;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>HTTP coverage for <c>POST /v1/admin/azure-extractor/hosted/run</c>.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
public sealed class HostedAzureExtractorRunEndpointTests(ApiKeyReaderAndAdminArchLucidApiFactory factory)
    : IClassFixture<ApiKeyReaderAndAdminArchLucidApiFactory>
{
    private const string EndpointPath = "/v1/admin/azure-extractor/hosted/run";

    [SkippableFact]
    public async Task Post_with_reader_key_returns_403()
    {
        using HttpClient client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Api-Key", ApiKeyReaderAndAdminArchLucidApiFactory.IntegrationTestReaderApiKey);
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using StringContent content = new("{\"subscriptionId\":\"sub-1\"}", Encoding.UTF8, "application/json");
        using HttpResponseMessage response = await client.PostAsync(EndpointPath, content);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [SkippableFact]
    public async Task Post_with_admin_key_when_feature_disabled_returns_503()
    {
        using HttpClient client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Api-Key", ApiKeyReaderAndAdminArchLucidApiFactory.IntegrationTestAdminApiKey);
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using StringContent content = new("{\"subscriptionId\":\"sub-1\"}", Encoding.UTF8, "application/json");
        using HttpResponseMessage response = await client.PostAsync(EndpointPath, content);

        response.StatusCode.Should().Be(HttpStatusCode.ServiceUnavailable);
    }

    [SkippableFact]
    public async Task Post_with_admin_key_and_missing_subscription_returns_400()
    {
        using HttpClient client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Api-Key", ApiKeyReaderAndAdminArchLucidApiFactory.IntegrationTestAdminApiKey);
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using StringContent content = new("{}", Encoding.UTF8, "application/json");
        using HttpResponseMessage response = await client.PostAsync(EndpointPath, content);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
