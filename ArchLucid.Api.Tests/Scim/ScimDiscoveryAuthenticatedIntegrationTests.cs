using System.Net;
using System.Net.Http.Headers;

using ArchLucid.Core.Scoping;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Scim;

[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
public sealed class ScimDiscoveryAuthenticatedIntegrationTests(JwtLocalSigningWebAppFactory factory) : IClassFixture<JwtLocalSigningWebAppFactory>
{
    [SkippableFact]
    public async Task ServiceProviderConfig_returns_application_scim_json_when_scim_bearer_accepted()
    {
        HttpClient http = await ScimIntegrationClientFactory.CreateAuthenticatedClientAsync(
            factory,
            ScopeIds.DefaultTenant);

        HttpResponseMessage response = await http.GetAsync("/scim/v2/ServiceProviderConfig");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/scim+json");

        string body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("\"patch\"");
    }

    [SkippableFact]
    public async Task ResourceTypes_lists_user_and_group_endpoints()
    {
        HttpClient http = await ScimIntegrationClientFactory.CreateAuthenticatedClientAsync(
            factory,
            ScopeIds.DefaultTenant);

        HttpResponseMessage response = await http.GetAsync("/scim/v2/ResourceTypes");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        string body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("/Users");
        body.Should().Contain("/Groups");
    }
}
