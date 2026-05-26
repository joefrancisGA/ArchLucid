using System.Net;

using ArchLucid.Host.Core.Diagnostics;

using FluentAssertions;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Host.Core.Tests.Diagnostics;

[Trait("Category", "Unit")]
public sealed class OidcAuthorityMetadataProbeTests
{
    [Fact]
    public async Task ProbeAsync_skips_when_auth_mode_is_not_jwt_bearer()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ArchLucidAuth:Mode"] = "ApiKey",
            })
            .Build();

        HttpClient client = new(new StubHttpMessageHandler(_ => throw new InvalidOperationException("HTTP must not run.")));

        OidcAuthorityMetadataProbe.ProbeResult result =
            await OidcAuthorityMetadataProbe.ProbeAsync(configuration, client, CancellationToken.None);

        result.IsApplicable.Should().BeFalse();
    }

    [Fact]
    public async Task ProbeAsync_returns_success_when_discovery_document_is_reachable()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ArchLucidAuth:Mode"] = "JwtBearer",
                ["ArchLucidAuth:Authority"] = "https://login.example.com/tenant/v2.0",
            })
            .Build();

        HttpClient client = new(new StubHttpMessageHandler(_ =>
            new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("{\"issuer\":\"https://login.example.com\"}"),
            }));

        OidcAuthorityMetadataProbe.ProbeResult result =
            await OidcAuthorityMetadataProbe.ProbeAsync(configuration, client, CancellationToken.None);

        result.Succeeded.Should().BeTrue();
        result.Detail.Should().Contain("openid-configuration");
    }

    private sealed class StubHttpMessageHandler(Func<HttpRequestMessage, HttpResponseMessage> responder) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) =>
            Task.FromResult(responder(request));
    }
}
