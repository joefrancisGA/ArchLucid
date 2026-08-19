using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Decisioning.Manifest;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Manifest;

[Trait("Category", "Unit")]
public sealed class AuthorityCommitManifestVersionRulesTests
{
    [Theory]
    [InlineData(null, "v1")]
    [InlineData("", "v1")]
    [InlineData("   ", "v1")]
    [InlineData("1.0.0", "v1.0.0")]
    [InlineData("v2", "v2")]
    [InlineData("V3.1", "V3.1")]
    public void ResolveContractManifestVersion_normalizes_authority_metadata(string? rawVersion, string expected)
    {
        ManifestMetadata metadata = new() { Version = rawVersion ?? string.Empty };

        AuthorityCommitManifestVersionRules.ResolveContractManifestVersion(metadata).Should().Be(expected);
    }

    [Fact]
    public void ResolveContractManifestVersion_from_manifest_document_matches_projection_builder()
    {
        ManifestDocument document = new()
        {
            Metadata = new ManifestMetadata { Version = "1.0.0" }
        };

        AuthorityCommitManifestVersionRules.ResolveContractManifestVersion(document).Should().Be("v1.0.0");
    }
}
