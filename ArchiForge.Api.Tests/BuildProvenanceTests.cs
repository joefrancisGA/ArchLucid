using System.Reflection;

using ArchiForge.Core.Diagnostics;

using FluentAssertions;

namespace ArchiForge.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class BuildProvenanceTests
{
    [Fact]
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

    [Fact]
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
        response.CommitSha.Should().BeNull();
    }
}
