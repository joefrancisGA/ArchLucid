using System.Net;

using ArchLucid.Core.Scoping;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Scim;

[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
public sealed class ScimBearerSecurityIntegrationTests(JwtLocalSigningWebAppFactory factory) : IClassFixture<JwtLocalSigningWebAppFactory>
{
    /// <summary>Same forged tenant the private-beta Playwright smoke sends as <c>x-tenant-id</c>.</summary>
    private static readonly Guid ForgedScimTenantId = Guid.Parse("99999999-9999-9999-9999-999999999999");

    [SkippableFact]
    public async Task Scim_discovery_requires_authentication()
    {
        HttpClient client = factory.CreateClient();
        HttpResponseMessage response = await client.GetAsync("/scim/v2/ServiceProviderConfig");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [SkippableFact]
    public async Task Scim_bearer_cannot_select_a_different_tenant_with_x_tenant_id()
    {
        HttpClient http = await ScimIntegrationClientFactory.CreateAuthenticatedClientAsync(factory);
        http.DefaultRequestHeaders.Add("x-tenant-id", ForgedScimTenantId.ToString("D"));

        using HttpResponseMessage response = await http.GetAsync("/scim/v2/Users");

        response.StatusCode.Should().Be(
            HttpStatusCode.Forbidden,
            "ScopeIdentityBindingMiddleware must authenticate ScimBearer before TB-072 header binding; "
            + "UseAuthentication only runs the default JwtBearer scheme.");
    }

    [SkippableFact]
    public async Task Scim_bearer_with_matching_tenant_header_is_not_rejected_by_scope_binding()
    {
        HttpClient http = await ScimIntegrationClientFactory.CreateAuthenticatedClientAsync(factory);
        http.DefaultRequestHeaders.Add("x-tenant-id", ScopeIds.DefaultTenant.ToString("D"));

        using HttpResponseMessage response = await http.GetAsync("/scim/v2/Users");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
