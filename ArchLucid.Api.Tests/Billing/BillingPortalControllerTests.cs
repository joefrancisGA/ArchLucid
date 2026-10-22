using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;

using ArchLucid.Api.Models.Billing;
using ArchLucid.Core.Authorization;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Billing;

[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
public sealed class BillingPortalControllerTests(JwtLocalSigningWebAppFactory factory) : IClassFixture<JwtLocalSigningWebAppFactory>
{
    [SkippableFact]
    public async Task Portal_without_bearer_returns_401()
    {
        HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.PostAsJsonAsync(
            "/v1/tenant/billing/portal",
            new BillingPortalPostRequest { ReturnUrl = "https://app.example.com/settings/billing" });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [SkippableFact]
    public async Task Portal_with_reader_jwt_returns_403()
    {
        string token = MintBearerJwtForPortalPolicyTests("ReaderUser", [ArchLucidRoles.Reader]);

        HttpClient client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        HttpResponseMessage response = await client.PostAsJsonAsync(
            "/v1/tenant/billing/portal",
            new BillingPortalPostRequest { ReturnUrl = "https://app.example.com/settings/billing" });

        string responseBody = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden, "response body: {0}", responseBody);
    }

    [SkippableFact]
    public async Task Portal_with_admin_jwt_without_subscription_returns_400()
    {
        string token = MintBearerJwtForPortalPolicyTests("AdminUser", [ArchLucidRoles.Admin]);

        HttpClient client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        HttpResponseMessage response = await client.PostAsJsonAsync(
            "/v1/tenant/billing/portal",
            new BillingPortalPostRequest { ReturnUrl = "https://app.example.com/settings/billing" });

        string responseBody = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest, "response body: {0}", responseBody);
    }

    [SkippableFact]
    public async Task Portal_with_admin_jwt_after_checkout_returns_200()
    {
        string token = MintBearerJwtForPortalPolicyTests("AdminUser", [ArchLucidRoles.Admin]);

        HttpClient client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        HttpResponseMessage checkoutResponse = await client.PostAsJsonAsync(
            "/v1/tenant/billing/checkout",
            new BillingCheckoutPostRequest
            {
                TargetTier = "Team",
                Seats = 1,
                Workspaces = 1,
                ReturnUrl = "https://app.example.com/ok",
                CancelUrl = "https://app.example.com/cancel"
            });

        checkoutResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        HttpResponseMessage portalResponse = await client.PostAsJsonAsync(
            "/v1/tenant/billing/portal",
            new BillingPortalPostRequest { ReturnUrl = "https://app.example.com/settings/billing" });

        string responseBody = await portalResponse.Content.ReadAsStringAsync();
        portalResponse.StatusCode.Should().Be(HttpStatusCode.OK, "response body: {0}", responseBody);

        BillingPortalResponseDto? dto = JsonSerializer.Deserialize<BillingPortalResponseDto>(
            responseBody,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        dto.Should().NotBeNull();
        dto.PortalUrl.Should().NotBeNullOrWhiteSpace();
        dto.ProviderSessionId.Should().NotBeNullOrWhiteSpace();
    }

    private string MintBearerJwtForPortalPolicyTests(string name, IReadOnlyList<string> roles) =>
        JwtLocalSigningIntegrationTestTokens.MintBearerJwt(
            factory.PrivatePemForTests,
            JwtLocalSigningWebAppFactory.JwtLocalTestIssuer,
            JwtLocalSigningWebAppFactory.JwtLocalTestAudience,
            name,
            roles);
}
