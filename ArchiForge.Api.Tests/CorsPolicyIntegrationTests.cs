using System.Net;

using FluentAssertions;

namespace ArchiForge.Api.Tests;

/// <summary>
/// Ensures <c>Cors:AllowedOrigins</c> does not reflect arbitrary browser <c>Origin</c> values (defense in depth with auth).
/// </summary>
[Trait("Category", "Integration")]
public sealed class CorsPolicyIntegrationTests : IClassFixture<CorsTrustedOriginApiFactory>
{
    private readonly HttpClient _client;

    public CorsPolicyIntegrationTests(CorsTrustedOriginApiFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task HealthCheck_DoesNotEmitAllowOrigin_ForDisallowedOrigin()
    {
        using HttpRequestMessage request = new(HttpMethod.Get, "/health");
        request.Headers.TryAddWithoutValidation("Origin", "https://malicious.example");

        HttpResponseMessage response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Headers.TryGetValues("Access-Control-Allow-Origin", out IEnumerable<string>? values).Should().BeFalse();
    }

    [Fact]
    public async Task HealthCheck_EmitsAllowOrigin_ForConfiguredOrigin()
    {
        using HttpRequestMessage request = new(HttpMethod.Get, "/health");
        request.Headers.TryAddWithoutValidation("Origin", "https://trusted.app.example");

        HttpResponseMessage response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        string? acao = response.Headers.TryGetValues("Access-Control-Allow-Origin", out IEnumerable<string>? v)
            ? v.FirstOrDefault()
            : null;
        acao.Should().Be("https://trusted.app.example");
    }
}
