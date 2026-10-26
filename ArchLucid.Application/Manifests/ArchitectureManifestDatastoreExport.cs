using ArchLucid.Contracts.Manifest;

namespace ArchLucid.Application.Manifests;

/// <summary>
///     Honest export labels for manifest datastore security fields whose schema defaults are not stored facts.
/// </summary>
public static class ArchitectureManifestDatastoreExport
{
    public const string EncryptionAtRestRequiredOmissionLabel =
        "Encryption at rest is required. Observed encryption at rest was not stored.";

    public const string EncryptionAtRestNotRequiredLabel = "Encryption at rest is not required.";

    public const string PrivateEndpointRequiredOmissionLabel =
        "Private endpoint is required. Observed private endpoint use was not stored.";

    public const string PrivateEndpointNotRequiredOmissionLabel =
        "Private endpoint is not required. Observed private endpoint use was not stored.";

    public static string FormatEncryptionAtRestRequiredForExport(bool encryptionAtRestRequired) =>
        encryptionAtRestRequired ? EncryptionAtRestRequiredOmissionLabel : EncryptionAtRestNotRequiredLabel;

    public static string FormatPrivateEndpointRequiredForExport(bool privateEndpointRequired) =>
        privateEndpointRequired ? PrivateEndpointRequiredOmissionLabel : PrivateEndpointNotRequiredOmissionLabel;
}
