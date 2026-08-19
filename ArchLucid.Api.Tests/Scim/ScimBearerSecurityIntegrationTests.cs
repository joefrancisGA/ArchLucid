using System.Net;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Scim;

[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
public sealed class ScimBearerSecurityIntegrationTests(JwtLocalSigningWebAppFactory factory) : IClassFixture<JwtLocalSigningWebAppFactory>
{
    [SkippableFact]
    public async Task Scim_discovery_requires_authentication()
    {
        HttpClient client = factory.CreateClient();
        HttpResponseMessage response = await client.GetAsync("/scim/v2/ServiceProviderConfig");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
