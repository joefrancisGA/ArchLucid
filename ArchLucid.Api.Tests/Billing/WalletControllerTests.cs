using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;

using ArchLucid.Api.Models.Billing;
using ArchLucid.Core.Authorization;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Billing;

[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
public sealed class WalletControllerTests(JwtLocalSigningWebAppFactory factory) : IClassFixture<JwtLocalSigningWebAppFactory>
{
    [SkippableFact]
    public async Task PutAsync_returns_400_when_row_version_base64_is_malformed()
    {
        string token = MintBearerJwtForWalletPolicyTests("AdminUser", [ArchLucidRoles.Admin]);

        HttpClient client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        HttpResponseMessage response = await client.PutAsJsonAsync(
            "/v1/billing/wallet",
            new LlmTenantWalletPutRequest
            {
                AutoReplenishEnabled = false,
                RowVersionBase64 = "!!!not-base64!!!",
            });

        string responseBody = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest, "response body: {0}", responseBody);
    }

    private string MintBearerJwtForWalletPolicyTests(string name, IReadOnlyList<string> roles) =>
        JwtLocalSigningIntegrationTestTokens.MintBearerJwt(
            factory.PrivatePemForTests,
            JwtLocalSigningWebAppFactory.JwtLocalTestIssuer,
            JwtLocalSigningWebAppFactory.JwtLocalTestAudience,
            name,
            roles);
}
