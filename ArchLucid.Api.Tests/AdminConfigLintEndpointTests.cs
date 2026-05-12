using System.Net;
using System.Text.Json;

using ArchLucid.Api.Tests.Security;
using ArchLucid.Core.Configuration.Summary;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>HTTP coverage for <c>GET /v1/admin/config-lint</c>.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
public sealed class AdminConfigLintEndpointTests(ApiKeyReaderAndAdminArchLucidApiFactory factory)
    : IClassFixture<ApiKeyReaderAndAdminArchLucidApiFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    [SkippableFact]
    public async Task Get_with_admin_key_returns_ok_shape()
    {
        using HttpClient client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Api-Key", ApiKeyReaderAndAdminArchLucidApiFactory.IntegrationTestAdminApiKey);
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using HttpResponseMessage response =
            await client.GetAsync("/v1/admin/config-lint?includeAdvisory=false");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        string body = await response.Content.ReadAsStringAsync();
        AdminConfigLintResponse? parsed = JsonSerializer.Deserialize<AdminConfigLintResponse>(body, JsonOptions);

        parsed.Should().NotBeNull();
        parsed!.HostingEnvironmentName.Should().NotBeNullOrWhiteSpace();
        parsed.BlockingFindings.Should().NotBeNull();
        parsed.AdvisoryFindings.Should().NotBeNull();
        parsed.AdvisoryFindings!.Count.Should().Be(0);
    }
}
