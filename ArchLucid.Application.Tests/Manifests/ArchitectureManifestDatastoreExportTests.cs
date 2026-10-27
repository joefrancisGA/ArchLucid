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
    public void Format_encryption_at_rest_uses_not_stored_sentence_when_false()
    {
        ArchitectureManifestDatastoreExport.FormatEncryptionAtRestRequiredForExport(false)
            .Should()
            .Be(ArchitectureManifestDatastoreExport.EncryptionAtRestRequirementNotStoredLabel);
    }

    [Fact]
    public void Format_private_endpoint_uses_required_omission_sentence_when_true()
    {
        ArchitectureManifestDatastoreExport.FormatPrivateEndpointRequiredForExport(true)
            .Should()
            .Be(ArchitectureManifestDatastoreExport.PrivateEndpointRequiredOmissionLabel);
    }

    [Fact]
    public void Format_private_endpoint_uses_not_stored_sentence_when_false()
    {
        ArchitectureManifestDatastoreExport.FormatPrivateEndpointRequiredForExport(false)
            .Should()
            .Be(ArchitectureManifestDatastoreExport.PrivateEndpointRequirementNotStoredLabel);
    }
}
