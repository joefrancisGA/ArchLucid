using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

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
            JwtLocalSigningWebAppFactory.JwtLocalTestIssuer,
            JwtLocalSigningWebAppFactory.JwtLocalTestAudience,
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

    /// <summary>
    ///     ReadAuthority + jobs route (same Jwt mint path as other facts in this class).
    /// </summary>
    [SkippableFact]
    [Trait("Suite", "Api")]
    public async Task Reader_jwt_allows_read_authority_jobs_route()
    {
        HttpClient client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", MintTrialRoleJwt(ArchLucidRoles.Reader));

        HttpResponseMessage response =
            await client.GetAsync(new Uri("/v1/jobs/00000000-0000-0000-0000-000000000001", UriKind.Relative));

        response.StatusCode.Should().NotBe(HttpStatusCode.Unauthorized);
        response.StatusCode.Should().NotBe(HttpStatusCode.Forbidden);
    }

    /// <summary>
    ///     ExecuteAuthority rejects Reader with <see cref="HttpStatusCode.Forbidden" /> when Jwt mint matches this fixture.
    /// </summary>
    [SkippableFact]
    [Trait("Suite", "Api")]
    public async Task Reader_jwt_forbidden_on_execute_authority_create_run()
    {
        HttpClient client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", MintTrialRoleJwt(ArchLucidRoles.Reader));

        using HttpRequestMessage request = new(HttpMethod.Post, "/v1/architecture/request");
        request.Content = new StringContent(
            JsonSerializer.Serialize(
                new
                {
                    requestId = $"trial-jwt-reader-{Guid.NewGuid():N}",
                    description = "Trial JWT reader role gate".PadRight(80, ' '),
                    systemName = "TrialJwtGate",
                    environment = "prod",
                    cloudProvider = 1,
                    constraints = Array.Empty<string>(),
                    requiredCapabilities = new[] { "SQL" },
                    assumptions = Array.Empty<string>(),
                    priorManifestVersion = (string?)null
                }),
            Encoding.UTF8,
            "application/json");

        HttpResponseMessage response = await client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    /// <summary>
    ///     ExecuteAuthority allows Admin when Jwt mint matches this fixture (does not assert 201 — orchestration side effects only).
    /// </summary>
    [SkippableFact]
    [Trait("Suite", "Api")]
    public async Task Admin_jwt_passes_execute_authority_role_gate_for_create_run()
    {
        HttpClient client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", MintTrialRoleJwt(ArchLucidRoles.Admin));

        using HttpRequestMessage request = new(HttpMethod.Post, "/v1/architecture/request");
        request.Content = new StringContent(
            JsonSerializer.Serialize(
                new
                {
                    requestId = $"trial-jwt-admin-{Guid.NewGuid():N}",
                    description = "Trial JWT admin role gate".PadRight(80, ' '),
                    systemName = "TrialJwtGate",
                    environment = "prod",
                    cloudProvider = 1,
                    constraints = Array.Empty<string>(),
                    requiredCapabilities = new[] { "SQL" },
                    assumptions = Array.Empty<string>(),
                    priorManifestVersion = (string?)null
                }),
            Encoding.UTF8,
            "application/json");

        HttpResponseMessage response = await client.SendAsync(request);

        response.StatusCode.Should().NotBe(HttpStatusCode.Forbidden);
        response.StatusCode.Should().NotBe(HttpStatusCode.Unauthorized);
    }

    private string MintTrialRoleJwt(string role)
    {
        return JwtLocalSigningIntegrationTestTokens.MintBearerJwt(
            factory.PrivatePemForTests,
            JwtLocalSigningWebAppFactory.JwtLocalTestIssuer,
            JwtLocalSigningWebAppFactory.JwtLocalTestAudience,
            $"{role.ToLowerInvariant()}@trial-jwt.test",
            [role]);
    }
}
