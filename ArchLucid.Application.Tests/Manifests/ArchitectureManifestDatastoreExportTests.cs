using ArchLucid.Application.Manifests;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Manifests;

[Trait("Suite", "Application")]
public sealed class ArchitectureManifestDatastoreExportTests
{
    [Fact]
    public void Format_encryption_at_rest_uses_omission_sentence_for_required_true()
    {
        ArchitectureManifestDatastoreExport.FormatEncryptionAtRestRequiredForExport(true)
            .Should()
            .Be(ArchitectureManifestDatastoreExport.EncryptionAtRestRequiredOmissionLabel);
    }

    [Fact]
    public void Format_encryption_at_rest_uses_no_only_when_false()
    {
        ArchitectureManifestDatastoreExport.FormatEncryptionAtRestRequiredForExport(false).Should().Be("No");
    }

    [Fact]
    public void Format_private_endpoint_uses_yes_only_when_true()
    {
        ArchitectureManifestDatastoreExport.FormatPrivateEndpointRequiredForExport(true).Should().Be("Yes");
    }

    [Fact]
    public void Format_private_endpoint_uses_omission_sentence_when_false()
    {
        ArchitectureManifestDatastoreExport.FormatPrivateEndpointRequiredForExport(false)
            .Should()
            .Be(ArchitectureManifestDatastoreExport.PrivateEndpointNotRequiredOmissionLabel);
    }
}
