using System.Reflection;

using ArchLucid.Core.Diagnostics;

using FluentAssertions;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class BuildProvenanceTests
{
    [SkippableFact]
    public void FromAssembly_returns_non_empty_versions_for_api_host()
    {
        Assembly api = typeof(Program).Assembly;

        BuildProvenance provenance = BuildProvenance.FromAssembly(api);

        provenance.InformationalVersion.Should().NotBeNullOrWhiteSpace();
        provenance.AssemblyVersion.Should().NotBeNullOrWhiteSpace();
        provenance.RuntimeFrameworkDescription.Should().Contain(".NET");
    }

    [Theory]
    [InlineData("1.0.0+abc123def", "abc123def")]
    [InlineData("1.0.0+abcdef1234567890abcdef1234567890abcdef12", "abcdef1234567890abcdef1234567890abcdef12")]
    [InlineData("1.0.0", null)]
    [InlineData("1.0.0+", null)]
    [InlineData("1.0.0+ ", null)]
    public void ParseCommitSha_extracts_sha_after_plus(string informational, string? expected)
    {
        string? result = BuildProvenance.ParseCommitSha(informational);

        result.Should().Be(expected);
    }

    [SkippableFact]
    public void BuildInfoResponse_FromProvenance_maps_all_fields()
    {
        BuildProvenance provenance = new(
            "1.0.0+abc123",
            "1.0.0.0",
            "1.0.0.0",
            ".NET 10.0.0",
            "abc123");

        BuildInfoResponse response = BuildInfoResponse.FromProvenance(provenance, "TestApp", "Staging");

        response.Application.Should().Be("TestApp");
        response.InformationalVersion.Should().Be("1.0.0+abc123");
        response.AssemblyVersion.Should().Be("1.0.0.0");
        response.FileVersion.Should().Be("1.0.0.0");
        response.CommitSha.Should().Be("abc123");
        response.RuntimeFramework.Should().Be(".NET 10.0.0");
        response.Environment.Should().Be("Staging");
    }

    [Fact]
    public void BuildInfoResponse_FromProvenance_maps_deployment_metadata_and_uptime()
    {
        BuildProvenance provenance = new("1.0.0+abc123", "1.0.0.0", null, ".NET 10.0.0", "abc123");
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ARCHLUCID_BUILD_TIMESTAMP"] = " 2026-01-02T03:04:05Z ",
                ["ARCHLUCID_BUILD_COMMIT_SHA"] = " def456 ",
                ["ARCHLUCID_DEPLOY_STAMP"] = " 12345-2 ",
            })
            .Build();

        BuildInfoResponse response = BuildInfoResponse.FromProvenance(
            provenance, "TestApp", "Staging", processUptimeSeconds: 137, configuration: configuration);

        response.BuildTimestamp.Should().Be("2026-01-02T03:04:05Z");
        response.CommitSha.Should().Be("def456");
        response.DeployStamp.Should().Be("12345-2");
        response.ProcessUptimeSeconds.Should().Be(137L);
    }

    [SkippableFact]
    public void BuildInfoResponse_FromProvenance_handles_null_optionals()
    {
        BuildProvenance provenance = new(
            "1.0.0",
            "1.0.0.0",
            null,
            ".NET 10.0.0",
            null);

        BuildInfoResponse response = BuildInfoResponse.FromProvenance(provenance, "TestApp", "Production");

        response.FileVersion.Should().BeNull();
        response.CommitSha.Should().Be("unknown");
        response.BuildTimestamp.Should().Be("unknown");
        response.DeployStamp.Should().Be("unknown");
    }
}
