namespace ArchLucid.Contracts.Manifest;

/// <summary>
///     Wave-14 suggestion 134: Hasher B projection row for committed artifact inventory.
/// </summary>
public sealed record CommittedArtifactInventoryFingerprintRow(
    string ArtifactName,
    string ContentType,
    string ContentHashSha256,
    string Producer,
    DateTime CapturedUtc);
