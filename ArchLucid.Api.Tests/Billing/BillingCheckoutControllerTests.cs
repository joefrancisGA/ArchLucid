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
        string token = JwtLocalSigningIntegrationTestTokens.MintBearerJwt(
            factory.PrivatePemForTests,
            "https://test.archlucid.local",
            "api://archlucid-jwt-local-test",
            "ReaderUser",
            [ArchLucidRoles.Reader]);

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

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [SkippableFact]
    public async Task Checkout_with_admin_jwt_returns_200()
    {
        string token = factory.MintLocalBearerJwt("AdminUser", [ArchLucidRoles.Admin]);

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

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        BillingCheckoutResponseDto? dto =
            await response.Content.ReadFromJsonAsync<BillingCheckoutResponseDto>(
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        dto.Should().NotBeNull();
        dto.CheckoutUrl.Should().NotBeNullOrWhiteSpace();
        dto.ProviderSessionId.Should().NotBeNullOrWhiteSpace();
    }
}
