using System.Net;
using System.Text.Json;

using ArchLucid.Contracts.Admin;
using ArchLucid.Api.Tests.Security;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>HTTP coverage for <c>GET /v1/admin/diagnostics/identity-providers</c>.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
public sealed class AdminIdentityProviderDiagnosticsEndpointTests(ApiKeyReaderAndAdminArchLucidApiFactory factory)
    : IClassFixture<ApiKeyReaderAndAdminArchLucidApiFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    [SkippableFact]
    public async Task Get_with_admin_key_returns_unified_oidc_and_saml_health_probes()
    {
        using HttpClient client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Api-Key", ApiKeyReaderAndAdminArchLucidApiFactory.IntegrationTestAdminApiKey);
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using HttpResponseMessage response =
            await client.GetAsync("/v1/admin/diagnostics/identity-providers");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        string body = await response.Content.ReadAsStringAsync();
        AdminIdentityProviderDiagnosticsResponse? parsed =
            JsonSerializer.Deserialize<AdminIdentityProviderDiagnosticsResponse>(body, JsonOptions);

        parsed.Should().NotBeNull();
        parsed!.Oidc.Should().NotBeNull();
        parsed.Saml.Should().NotBeNull();
        parsed.Oidc.Status.Should().Be(IdentityProviderDiagnosticsHealthStatus.NotApplicable);
        parsed.Saml.Status.Should().BeOneOf(
            IdentityProviderDiagnosticsHealthStatus.NotApplicable,
            IdentityProviderDiagnosticsHealthStatus.Healthy,
            IdentityProviderDiagnosticsHealthStatus.Degraded,
            IdentityProviderDiagnosticsHealthStatus.Unreachable);
    }
}
