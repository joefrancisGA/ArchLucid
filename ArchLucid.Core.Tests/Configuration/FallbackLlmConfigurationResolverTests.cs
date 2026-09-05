using ArchLucid.Core.Configuration;

using FluentAssertions;

#pragma warning disable CS0618 // Tests intentionally exercise legacy flat FallbackLlm properties.

namespace ArchLucid.Core.Tests.Configuration;

[Trait("Category", "Unit")]
public sealed class FallbackLlmConfigurationResolverTests
{
    [Fact]
    public void ResolveOrderedEndpoints_disabled_returns_empty()
    {
        FallbackLlmOptions o = new() { Enabled = false, Endpoints = [new FallbackLlmEndpointOptions { Endpoint = "x" }] };

        IReadOnlyList<FallbackLlmResolvedEndpoint> r = FallbackLlmConfigurationResolver.ResolveOrderedEndpoints(o);

        r.Should().BeEmpty();
    }

    [Fact]
    public void ResolveOrderedEndpoints_prefers_Endpoints_array_over_legacy_triple()
    {
        FallbackLlmOptions o = new()
        {
            Enabled = true,
            Endpoint = "https://legacy/",
            ApiKey = "legacy-key",
            DeploymentName = "legacy-dep",
            Endpoints =
            [
                new FallbackLlmEndpointOptions
                {
                    Endpoint = "https://a/",
                    ApiKey = "ka",
                    DeploymentName = "da",
                },
                new FallbackLlmEndpointOptions
                {
                    Endpoint = "https://b/",
                    ApiKey = "kb",
                    DeploymentName = "db",
                },
            ],
        };

        IReadOnlyList<FallbackLlmResolvedEndpoint> r = FallbackLlmConfigurationResolver.ResolveOrderedEndpoints(o);

        r.Should().HaveCount(2);
        r[0].Endpoint.Should().Be("https://a/");
        r[0].ApiKey.Should().Be("ka");
        r[0].DeploymentName.Should().Be("da");
        r[0].UseManagedIdentity.Should().BeFalse();
        r[1].Endpoint.Should().Be("https://b/");
        r[1].ApiKey.Should().Be("kb");
        r[1].DeploymentName.Should().Be("db");
    }

    [Fact]
    public void ResolveOrderedEndpoints_skips_incomplete_rows_then_legacy()
    {
        FallbackLlmOptions o = new()
        {
            Enabled = true,
            Endpoint = "https://legacy/",
            ApiKey = "lk",
            DeploymentName = "ld",
            Endpoints =
            [
                new FallbackLlmEndpointOptions { Endpoint = " ", ApiKey = "x", DeploymentName = "y" },
            ],
        };

        IReadOnlyList<FallbackLlmResolvedEndpoint> r = FallbackLlmConfigurationResolver.ResolveOrderedEndpoints(o);

        r.Should().ContainSingle();
        r[0].Endpoint.Should().Be("https://legacy/");
        r[0].ApiKey.Should().Be("lk");
        r[0].DeploymentName.Should().Be("ld");
        r[0].UseManagedIdentity.Should().BeFalse();
    }

    [Fact]
    public void ResolveOrderedEndpoints_accepts_managed_identity_row_without_api_key()
    {
        FallbackLlmOptions o = new()
        {
            Enabled = true,
            Endpoints =
            [
                new FallbackLlmEndpointOptions
                {
                    Endpoint = "https://fallback.openai.azure.com/",
                    DeploymentName = "gpt-fallback",
                    UseManagedIdentity = true,
                },
            ],
        };

        IReadOnlyList<FallbackLlmResolvedEndpoint> r = FallbackLlmConfigurationResolver.ResolveOrderedEndpoints(o);

        r.Should().ContainSingle();
        r[0].Endpoint.Should().Be("https://fallback.openai.azure.com/");
        r[0].DeploymentName.Should().Be("gpt-fallback");
        r[0].ApiKey.Should().BeEmpty();
        r[0].UseManagedIdentity.Should().BeTrue();
    }

    [Fact]
    public void ResolveOrderedEndpoints_throws_when_enabled_and_nothing_complete()
    {
        FallbackLlmOptions o = new() { Enabled = true, Endpoints = [] };

        Action act = () => FallbackLlmConfigurationResolver.ResolveOrderedEndpoints(o);

        act.Should().Throw<InvalidOperationException>().WithMessage("*FallbackLlm*");
    }
}
