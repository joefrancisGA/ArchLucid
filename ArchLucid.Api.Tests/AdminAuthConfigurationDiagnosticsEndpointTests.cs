using System.Net;
using System.Text.Json;

using ArchLucid.Api.Tests.Security;
using ArchLucid.Contracts.Admin;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>HTTP coverage for <c>GET /v1/admin/auth/configuration-diagnostics</c>.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
public sealed class AdminAuthConfigurationDiagnosticsEndpointTests(ApiKeyReaderAndAdminArchLucidApiFactory factory)
    : IClassFixture<ApiKeyReaderAndAdminArchLucidApiFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    [SkippableFact]
    public async Task Get_with_admin_key_returns_configuration_checks()
    {
        using HttpClient client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Api-Key", ApiKeyReaderAndAdminArchLucidApiFactory.IntegrationTestAdminApiKey);
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using HttpResponseMessage response =
            await client.GetAsync("/v1/admin/auth/configuration-diagnostics");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        string body = await response.Content.ReadAsStringAsync();
        AdminAuthConfigurationDiagnosticsResponse? parsed =
            JsonSerializer.Deserialize<AdminAuthConfigurationDiagnosticsResponse>(body, JsonOptions);

        parsed.Should().NotBeNull();
        parsed!.AuthMode.Should().Be("ApiKey");
        parsed.AudienceConfigured.Should().BeFalse();
        parsed.MisconfigurationHints.Should().NotBeEmpty();
    }
}
