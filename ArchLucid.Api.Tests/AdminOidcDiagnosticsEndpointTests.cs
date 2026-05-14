using System.Net;
using System.Text.Json;

using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Api.Tests.Security;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>HTTP coverage for <c>GET /v1/admin/auth/oidc-diagnostics</c>.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
public sealed class AdminOidcDiagnosticsEndpointTests(ApiKeyReaderAndAdminArchLucidApiFactory factory)
    : IClassFixture<ApiKeyReaderAndAdminArchLucidApiFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    [SkippableFact]
    public async Task Get_with_admin_key_returns_ok_shape_for_api_key_hosting()
    {
        using HttpClient client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Api-Key", ApiKeyReaderAndAdminArchLucidApiFactory.IntegrationTestAdminApiKey);
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using HttpResponseMessage response = await client.GetAsync("/v1/admin/auth/oidc-diagnostics");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        string body = await response.Content.ReadAsStringAsync();
        AdminOidcDiagnosticsResponse? parsed = JsonSerializer.Deserialize<AdminOidcDiagnosticsResponse>(body, JsonOptions);

        parsed.Should().NotBeNull();
        parsed!.AuthMode.Should().Be("ApiKey");
        parsed.ConfiguredAuthority.Should().BeNull();
        parsed.DiagnosticSummary.Should().Contain("not JwtBearer");
        parsed.DiscoveryAttempted.Should().BeFalse();
    }
}
