using ArchLucid.Api.Auth.Models;
using ArchLucid.Api.Configuration;

using FluentAssertions;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Api.Tests.Configuration;

public sealed class ArchLucidAuthConfigurationBridgeTests
{
    [SkippableFact]
    public void Resolve_merges_ArchLucidAuth_over_legacy()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["ArchLucidAuth:Mode"] = "ApiKey", ["ArchLucidAuth:Audience"] = "api://legacy"
                })
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["ArchLucidAuth:Mode"] = "JwtBearer", ["ArchLucidAuth:Authority"] = "https://login.example/"
                })
            .Build();

        ArchLucidAuthOptions options = ArchLucidAuthConfigurationBridge.Resolve(configuration);

        options.Mode.Should().Be("JwtBearer");
        options.Authority.Should().Be("https://login.example/");
        options.Audience.Should().Be("api://legacy");
    }

    [SkippableFact]
    public void Resolve_forces_JwtBearer_when_JwtSigningPublicKeyPemPath_is_set_even_if_Mode_was_DevelopmentBypass()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
                    ["ArchLucidAuth:JwtSigningPublicKeyPemPath"] = "/nonexistent/for-bridge-unit-test.pem"
                })
            .Build();

        ArchLucidAuthOptions options = ArchLucidAuthConfigurationBridge.Resolve(configuration);

        options.Mode.Should().Be("JwtBearer");
        options.JwtSigningPublicKeyPemPath.Should().Be("/nonexistent/for-bridge-unit-test.pem");
    }
}
