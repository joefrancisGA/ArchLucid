using ArchLucid.Core.Security;

using FluentAssertions;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Core.Tests.Security;

[Trait("Category", "Unit")]
public sealed class TrustedApiLinkBaseResolverTests
{
    [Fact]
    public void Resolve_prefers_configured_public_api_base_url()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    [TrustedApiLinkBaseResolver.PublicApiBaseUrlConfigurationKey] = "https://api.customer.example/",
                })
            .Build();

        string resolved = TrustedApiLinkBaseResolver.Resolve(configuration, "http", "evil.internal");

        resolved.Should().Be("https://api.customer.example");
    }

    [Fact]
    public void Resolve_ignores_host_header_when_it_is_loopback_literal()
    {
        IConfiguration configuration = new ConfigurationBuilder().Build();

        string resolved = TrustedApiLinkBaseResolver.Resolve(configuration, "https", "127.0.0.1");

        resolved.Should().Be("http://localhost:5000");
    }

    [Theory]
    [InlineData("127.0.0.1:443")]
    [InlineData("10.1.2.3:8443")]
    [InlineData("192.168.1.1:443")]
    [InlineData("169.254.1.1:80")]
    [InlineData("[::1]:443")]
    [InlineData("[fd00::1]:443")]
    [InlineData("localhost.:8443")]
    [InlineData("user@api.customer.example")]
    [InlineData("api.customer.example/path")]
    public void Resolve_rejects_private_or_invalid_request_authorities(string host)
    {
        IConfiguration configuration = new ConfigurationBuilder().Build();

        TrustedApiLinkBaseResolver.Resolve(configuration, "https", host)
            .Should().Be("http://localhost:5000");
    }

    [Fact]
    public void Resolve_preserves_public_port()
    {
        IConfiguration configuration = new ConfigurationBuilder().Build();

        TrustedApiLinkBaseResolver.Resolve(configuration, "https", "api.customer.example:8443")
            .Should().Be("https://api.customer.example:8443");
    }

    [Fact]
    public void Resolve_rejects_non_http_scheme()
    {
        IConfiguration configuration = new ConfigurationBuilder().Build();

        TrustedApiLinkBaseResolver.Resolve(configuration, "ftp", "api.customer.example")
            .Should().Be("http://localhost:5000");
    }

    [Fact]
    public void Resolve_uses_request_when_host_is_public()
    {
        IConfiguration configuration = new ConfigurationBuilder().Build();

        string resolved = TrustedApiLinkBaseResolver.Resolve(configuration, "https", "api.customer.example");

        resolved.Should().Be("https://api.customer.example");
    }
}
