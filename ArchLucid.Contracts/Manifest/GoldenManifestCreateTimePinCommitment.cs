using ArchLucid.Contracts.Governance.PolicyPacks;

namespace ArchLucid.Contracts.Manifest;

/// <summary>
///     Wave-9 suggestion 86: optional create-time pin rows bound alongside Hasher B structural projection.
/// </summary>
public sealed record GoldenManifestCreateTimePinCommitment(
    IReadOnlyList<PinnedPolicyPackRow> PolicyPackPins,
    IReadOnlyList<PinnedEvidencePackageRow> EvidencePackagePins,
    string? EvidencePackagePinsHashSha256Hex);
