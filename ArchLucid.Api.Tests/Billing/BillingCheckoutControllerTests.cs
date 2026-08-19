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
public sealed class BillingCheckoutControllerTests(JwtLocalSigningWebAppFactory factory) : IClassFixture<JwtLocalSigningWebAppFactory>
{
    [SkippableFact]
    public async Task Checkout_without_bearer_returns_401()
    {
        HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.PostAsJsonAsync(
            "/v1/tenant/billing/checkout",
            new BillingCheckoutPostRequest
            {
                TargetTier = "Team",
                Seats = 1,
                Workspaces = 1,
                ReturnUrl = "https://app.example.com/ok",
                CancelUrl = "https://app.example.com/cancel"
            });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [SkippableFact]
    public async Task Checkout_with_reader_jwt_returns_403()
    {
        string token = MintBearerJwtForCheckoutPolicyTests("ReaderUser", [ArchLucidRoles.Reader]);

        HttpClient client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        HttpResponseMessage response = await client.PostAsJsonAsync(
            "/v1/tenant/billing/checkout",
            new BillingCheckoutPostRequest
            {
                TargetTier = "Team",
                Seats = 1,
                Workspaces = 1,
                ReturnUrl = "https://app.example.com/ok",
                CancelUrl = "https://app.example.com/cancel"
            });

        string responseBody = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden, "response body: {0}", responseBody);
    }

    [SkippableFact]
    public async Task Checkout_with_admin_jwt_returns_200()
    {
        string token = MintBearerJwtForCheckoutPolicyTests("AdminUser", [ArchLucidRoles.Admin]);

        HttpClient client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        HttpResponseMessage response = await client.PostAsJsonAsync(
            "/v1/tenant/billing/checkout",
            new BillingCheckoutPostRequest
            {
                TargetTier = "Team",
                Seats = 2,
                Workspaces = 1,
                BillingEmail = "billing@example.com",
                ReturnUrl = "https://app.example.com/ok",
                CancelUrl = "https://app.example.com/cancel"
            });

        string responseBody = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.OK, "response body: {0}", responseBody);

        BillingCheckoutResponseDto? dto = JsonSerializer.Deserialize<BillingCheckoutResponseDto>(
            responseBody,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        dto.Should().NotBeNull();
        dto.CheckoutUrl.Should().NotBeNullOrWhiteSpace();
        dto.ProviderSessionId.Should().NotBeNullOrWhiteSpace();
    }

    private string MintBearerJwtForCheckoutPolicyTests(string name, IReadOnlyList<string> roles) =>
        JwtLocalSigningIntegrationTestTokens.MintBearerJwt(
            factory.PrivatePemForTests,
            JwtLocalSigningWebAppFactory.JwtLocalTestIssuer,
            JwtLocalSigningWebAppFactory.JwtLocalTestAudience,
            name,
            roles);
}
