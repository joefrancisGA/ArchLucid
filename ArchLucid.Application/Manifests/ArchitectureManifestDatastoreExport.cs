using ArchLucid.Contracts.Manifest;

namespace ArchLucid.Application.Manifests;

/// <summary>
///     Honest export labels for manifest datastore security fields whose schema defaults are not stored facts.
/// </summary>
public static class ArchitectureManifestDatastoreExport
{
    public const string EncryptionAtRestRequiredOmissionLabel =
        "Encryption at rest is required. Observed encryption at rest was not stored.";

    public const string PrivateEndpointNotRequiredOmissionLabel =
        "Private endpoint is not required. Observed private endpoint use was not stored.";

    public static string FormatEncryptionAtRestRequiredForExport(bool encryptionAtRestRequired) =>
        encryptionAtRestRequired ? EncryptionAtRestRequiredOmissionLabel : "No";

    public static string FormatPrivateEndpointRequiredForExport(bool privateEndpointRequired) =>
        privateEndpointRequired ? "Yes" : PrivateEndpointNotRequiredOmissionLabel;
}
