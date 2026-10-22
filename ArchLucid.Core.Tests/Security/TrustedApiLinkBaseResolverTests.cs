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

    [Fact]
    public void Resolve_uses_request_when_host_is_public()
    {
        IConfiguration configuration = new ConfigurationBuilder().Build();

        string resolved = TrustedApiLinkBaseResolver.Resolve(configuration, "https", "api.customer.example");

        resolved.Should().Be("https://api.customer.example");
    }
}
