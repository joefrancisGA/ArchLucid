using System.Net;
using System.Text.Json;

using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Api.Tests.Security;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>HTTP coverage for <c>GET /v1/admin/auth/saml-operational-health</c>.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
public sealed class AdminSamlOperationalHealthEndpointTests(ApiKeyReaderAndAdminArchLucidApiFactory factory)
    : IClassFixture<ApiKeyReaderAndAdminArchLucidApiFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    [SkippableFact]
    public async Task Get_with_admin_key_returns_ok_when_saml_disabled_by_default()
    {
        using HttpClient client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Api-Key", ApiKeyReaderAndAdminArchLucidApiFactory.IntegrationTestAdminApiKey);
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using HttpResponseMessage response = await client.GetAsync("/v1/admin/auth/saml-operational-health");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        string body = await response.Content.ReadAsStringAsync();
        AdminSamlOperationalHealthResponse? parsed = JsonSerializer.Deserialize<AdminSamlOperationalHealthResponse>(body, JsonOptions);

        parsed.Should().NotBeNull();
        parsed!.Saml2Enabled.Should().BeFalse();
        parsed.SpSigningCertificateNotAfterUtc.Should().BeNull();
        parsed.IdpMetadataValidUntilUtc.Should().BeNull();
    }
}
