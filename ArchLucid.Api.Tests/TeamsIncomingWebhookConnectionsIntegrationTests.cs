using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text.Json;

using ArchLucid.Api.Routing;
using ArchLucid.Contracts.Integrations;
using ArchLucid.Core.Authorization;

using FluentAssertions;

using Microsoft.IdentityModel.Tokens;

namespace ArchLucid.Api.Tests;

public sealed class TeamsIncomingWebhookConnectionsIntegrationTests : IClassFixture<JwtLocalSigningWebAppFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true,
    };

    private readonly JwtLocalSigningWebAppFactory _factory;

    public TeamsIncomingWebhookConnectionsIntegrationTests(JwtLocalSigningWebAppFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Post_connections_with_reader_jwt_returns_forbidden()
    {
        string token = MintJwt(
            _factory.PrivatePemForTests,
            issuer: "https://test.archlucid.local",
            audience: "api://archlucid-jwt-local-test",
            name: "ReaderUser",
            roles: [ArchLucidRoles.Reader]);

        HttpClient client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        TeamsIncomingWebhookConnectionUpsertRequest body = new()
        {
            KeyVaultSecretName = "teams-incoming-webhook-demo",
        };

        HttpResponseMessage res = await client.PostAsJsonAsync(
            new Uri($"/{ApiV1Routes.TeamsIncomingWebhookConnections}", UriKind.Relative),
            body);

        res.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Post_connections_with_https_body_returns_bad_request()
    {
        string token = MintJwt(
            _factory.PrivatePemForTests,
            issuer: "https://test.archlucid.local",
            audience: "api://archlucid-jwt-local-test",
            name: "OperatorUser",
            roles: [ArchLucidRoles.Operator]);

        HttpClient client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        TeamsIncomingWebhookConnectionUpsertRequest body = new()
        {
            KeyVaultSecretName = "https://example.invalid/hook",
        };

        HttpResponseMessage res = await client.PostAsJsonAsync(
            new Uri($"/{ApiV1Routes.TeamsIncomingWebhookConnections}", UriKind.Relative),
            body);

        res.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Get_post_delete_round_trip_with_operator_jwt()
    {
        string token = MintJwt(
            _factory.PrivatePemForTests,
            issuer: "https://test.archlucid.local",
            audience: "api://archlucid-jwt-local-test",
            name: "OperatorUser",
            roles: [ArchLucidRoles.Operator]);

        HttpClient client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        HttpResponseMessage get0 = await client.GetAsync(new Uri($"/{ApiV1Routes.TeamsIncomingWebhookConnections}", UriKind.Relative));
        get0.StatusCode.Should().Be(HttpStatusCode.OK);
        TeamsIncomingWebhookConnectionResponse? parsed0 =
            await get0.Content.ReadFromJsonAsync<TeamsIncomingWebhookConnectionResponse>(JsonOptions);
        parsed0.Should().NotBeNull();
        parsed0!.IsConfigured.Should().BeFalse();

        TeamsIncomingWebhookConnectionUpsertRequest putBody = new()
        {
            KeyVaultSecretName = "kv-teams-webhook-ref",
            Label = "demo tenant — replace before publishing",
        };

        HttpResponseMessage post = await client.PostAsJsonAsync(
            new Uri($"/{ApiV1Routes.TeamsIncomingWebhookConnections}", UriKind.Relative),
            putBody);
        post.StatusCode.Should().Be(HttpStatusCode.OK);
        TeamsIncomingWebhookConnectionResponse? postParsed =
            await post.Content.ReadFromJsonAsync<TeamsIncomingWebhookConnectionResponse>(JsonOptions);
        postParsed.Should().NotBeNull();
        postParsed!.IsConfigured.Should().BeTrue();
        postParsed.KeyVaultSecretName.Should().Be("kv-teams-webhook-ref");

        HttpResponseMessage get1 = await client.GetAsync(new Uri($"/{ApiV1Routes.TeamsIncomingWebhookConnections}", UriKind.Relative));
        get1.StatusCode.Should().Be(HttpStatusCode.OK);

        HttpResponseMessage del = await client.SendAsync(
            new HttpRequestMessage(HttpMethod.Delete, new Uri($"/{ApiV1Routes.TeamsIncomingWebhookConnections}", UriKind.Relative)));
        del.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    private static string MintJwt(
        string privatePkcs8Pem,
        string issuer,
        string audience,
        string name,
        IReadOnlyList<string> roles)
    {
        using RSA rsa = RSA.Create();
        rsa.ImportFromPem(privatePkcs8Pem);
        RSAParameters keyMaterial = rsa.ExportParameters(includePrivateParameters: true);
        RsaSecurityKey signingKey = new(keyMaterial);
        SigningCredentials creds = new(signingKey, SecurityAlgorithms.RsaSha256);

        List<Claim> claims = [new(JwtRegisteredClaimNames.Sub, "test-sub"), new("name", name)];

        foreach (string r in roles)
        {
            claims.Add(new Claim("roles", r));
        }

        JwtSecurityTokenHandler handler = new();
        JwtSecurityToken token = new(
            issuer: issuer,
            audience: audience,
            claims: claims,
            notBefore: DateTime.UtcNow.AddMinutes(-1),
            expires: DateTime.UtcNow.AddHours(1),
            signingCredentials: creds);

        return handler.WriteToken(token);
    }
}
