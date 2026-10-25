using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Comparison;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Normalizes compare input fingerprint hashes on nested diff sections before persist and rehydrate.
/// </summary>
internal static class CompareInputFingerprintsNormalizer
{
    internal static void NormalizeInPlace(CompareInputFingerprints? fingerprints)
    {
        if (fingerprints is null)
            return;

        string? algorithmVersion =
            OptionalExportMetadataStringNormalizer.NormalizeOptionalString(fingerprints.ComparisonAlgorithmVersion);
        fingerprints.ComparisonAlgorithmVersion = algorithmVersion ?? CompareInputFingerprints.AlgorithmVersion;

        fingerprints.BasePolicyPackPinHashSha256 = NormalizeOptionalHash(fingerprints.BasePolicyPackPinHashSha256);
        fingerprints.TargetPolicyPackPinHashSha256 = NormalizeOptionalHash(fingerprints.TargetPolicyPackPinHashSha256);
        fingerprints.BaseEvidencePackagePinHashSha256 = NormalizeOptionalHash(fingerprints.BaseEvidencePackagePinHashSha256);
        fingerprints.TargetEvidencePackagePinHashSha256 = NormalizeOptionalHash(fingerprints.TargetEvidencePackagePinHashSha256);
        fingerprints.BaseArchitectureVersionContentHashSha256 =
            NormalizeOptionalHash(fingerprints.BaseArchitectureVersionContentHashSha256);
        fingerprints.TargetArchitectureVersionContentHashSha256 =
            NormalizeOptionalHash(fingerprints.TargetArchitectureVersionContentHashSha256);
        fingerprints.BaseKnowledgeModelContentHashSha256 = NormalizeOptionalHash(fingerprints.BaseKnowledgeModelContentHashSha256);
        fingerprints.TargetKnowledgeModelContentHashSha256 =
            NormalizeOptionalHash(fingerprints.TargetKnowledgeModelContentHashSha256);
        fingerprints.BaseManifestHashSha256 = NormalizeOptionalHash(fingerprints.BaseManifestHashSha256);
        fingerprints.TargetManifestHashSha256 = NormalizeOptionalHash(fingerprints.TargetManifestHashSha256);
        fingerprints.BaseCommittedArtifactInventoryHashSha256 =
            NormalizeOptionalHash(fingerprints.BaseCommittedArtifactInventoryHashSha256);
        fingerprints.TargetCommittedArtifactInventoryHashSha256 =
            NormalizeOptionalHash(fingerprints.TargetCommittedArtifactInventoryHashSha256);
    }

    private static string? NormalizeOptionalHash(string? value) =>
        OptionalExportMetadataStringNormalizer.NormalizeOptionalString(value);
}
