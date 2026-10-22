using ArchLucid.Core.Diagnostics;

using FluentAssertions;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Core.Tests.Diagnostics;

[Trait("Category", "Unit")]
public sealed class DeploymentBuildMetadataTests
{
    [Fact]
    public void ResolveBuildTimestamp_returns_unknown_when_not_configured()
    {
        DeploymentBuildMetadata.ResolveBuildTimestamp().Should().Be("unknown");
    }

    [Fact]
    public void ResolveBuildTimestamp_prefers_configuration_over_environment()
    {
        Dictionary<string, string?> values = new()
        {
            [DeploymentBuildMetadata.BuildTimestampVariable] = "2026-07-03T12:00:00Z",
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(values).Build();

        DeploymentBuildMetadata.ResolveBuildTimestamp(configuration).Should().Be("2026-07-03T12:00:00Z");
    }

    [Fact]
    public void ResolveCommitSha_prefers_configuration_over_provenance()
    {
        BuildProvenance provenance = new("1.0.0+from-assembly", "1.0.0.0", null, ".NET Test", "from-assembly");
        Dictionary<string, string?> values = new()
        {
            [DeploymentBuildMetadata.BuildCommitShaVariable] = "from-config",
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(values).Build();

        DeploymentBuildMetadata.ResolveCommitSha(provenance, configuration).Should().Be("from-config");
    }

    [Fact]
    public void ResolveCommitSha_falls_back_to_provenance_then_unknown()
    {
        BuildProvenance withSha = new("1.0.0+abc123", "1.0.0.0", null, ".NET Test", "abc123");
        BuildProvenance withoutSha = new("1.0.0", "1.0.0.0", null, ".NET Test", null);

        DeploymentBuildMetadata.ResolveCommitSha(withSha).Should().Be("abc123");
        DeploymentBuildMetadata.ResolveCommitSha(withoutSha).Should().Be("unknown");
    }

    [Fact]
    public void ResolveDeployStamp_prefers_configuration_then_cd_deploy_run()
    {
        Dictionary<string, string?> values = new()
        {
            [DeploymentBuildMetadata.DeployStampVariable] = "from-config-stamp",
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(values).Build();

        DeploymentBuildMetadata.ResolveDeployStamp(configuration).Should().Be("from-config-stamp");
    }

    [Fact]
    public void ResolveDeployStamp_returns_unknown_when_not_configured()
    {
        DeploymentBuildMetadata.ResolveDeployStamp().Should().Be("unknown");
    }
}
