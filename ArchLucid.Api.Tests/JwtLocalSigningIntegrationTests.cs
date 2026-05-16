using System.Net;
using System.Net.Http.Headers;

using ArchLucid.Core.Authorization;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>JWT validation using <see cref="ArchLucidAuthOptions.JwtSigningPublicKeyPemPath" /> (CI / local E2E pattern).</summary>
[Trait("Category", "Integration")]
public sealed class JwtLocalSigningIntegrationTests(JwtLocalSigningWebAppFactory factory) : IClassFixture<JwtLocalSigningWebAppFactory>
{
    [SkippableFact]
    public async Task Get_architecture_runs_with_valid_local_jwt_returns_OK()
    {
        string token = JwtLocalSigningIntegrationTestTokens.MintBearerJwt(
            factory.PrivatePemForTests,
            "https://test.archlucid.local",
            "api://archlucid-jwt-local-test",
            "JwtTestUser",
            [ArchLucidRoles.Admin]);

        HttpClient client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        HttpResponseMessage res = await client.GetAsync(new Uri("/v1/architecture/runs", UriKind.Relative));

        res.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [SkippableFact]
    public async Task Get_architecture_runs_with_malformed_bearer_returns_Unauthorized()
    {
        HttpClient client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "not-a-valid-jwt");

        HttpResponseMessage res = await client.GetAsync(new Uri("/v1/architecture/runs", UriKind.Relative));

        res.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
