using ArchLucid.Core.Configuration;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Configuration;
[Trait("Category", "Unit")]

public sealed class FallbackLlmConfigurationResolverTests
{
    [Fact]
    public void ResolveOrderedEndpoints_disabled_returns_empty()
    {
        FallbackLlmOptions o = new() { Enabled = false, Endpoints = [new FallbackLlmEndpointOptions { Endpoint = "x" }] };

        IReadOnlyList<(string, string, string)> r = FallbackLlmConfigurationResolver.ResolveOrderedEndpoints(o);

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

        IReadOnlyList<(string e, string k, string d)> r = FallbackLlmConfigurationResolver.ResolveOrderedEndpoints(o);

        r.Should().HaveCount(2);
        r[0].Should().Be(("https://a/", "ka", "da"));
        r[1].Should().Be(("https://b/", "kb", "db"));
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

        IReadOnlyList<(string e, string k, string d)> r = FallbackLlmConfigurationResolver.ResolveOrderedEndpoints(o);

        r.Should().ContainSingle();
        r[0].Should().Be(("https://legacy/", "lk", "ld"));
    }

    [Fact]
    public void ResolveOrderedEndpoints_throws_when_enabled_and_nothing_complete()
    {
        FallbackLlmOptions o = new() { Enabled = true, Endpoints = [] };

        Action act = () => FallbackLlmConfigurationResolver.ResolveOrderedEndpoints(o);

        act.Should().Throw<InvalidOperationException>().WithMessage("*FallbackLlm*");
    }
}
