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

        fingerprints.ComparisonAlgorithmVersion =
            NormalizeComparisonAlgorithmVersion(fingerprints.ComparisonAlgorithmVersion);

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

    internal static bool IsPersistedEmptyShell(CompareInputFingerprints fingerprints) =>
        fingerprints.ComparisonAlgorithmVersion == CompareInputFingerprints.AlgorithmVersion
        && fingerprints.BasePolicyPackPinHashSha256 is null
        && fingerprints.TargetPolicyPackPinHashSha256 is null
        && fingerprints.BaseEvidencePackagePinHashSha256 is null
        && fingerprints.TargetEvidencePackagePinHashSha256 is null
        && fingerprints.BaseArchitectureVersionContentHashSha256 is null
        && fingerprints.TargetArchitectureVersionContentHashSha256 is null
        && fingerprints.BaseKnowledgeModelContentHashSha256 is null
        && fingerprints.TargetKnowledgeModelContentHashSha256 is null
        && fingerprints.BaseManifestHashSha256 is null
        && fingerprints.TargetManifestHashSha256 is null
        && fingerprints.BaseCommittedArtifactInventoryHashSha256 is null
        && fingerprints.TargetCommittedArtifactInventoryHashSha256 is null;

    private static string? NormalizeOptionalHash(string? value)
    {
        string? normalized = OptionalExportMetadataStringNormalizer.NormalizeOptionalString(value);
        if (normalized is null)
            return null;

        if (normalized.Length != 64)
            return null;

        for (int i = 0; i < normalized.Length; i++)
        {
            if (!Uri.IsHexDigit(normalized[i]))
                return null;
        }

        return normalized.ToLowerInvariant();
    }

    private static string NormalizeComparisonAlgorithmVersion(string value)
    {
        string? normalized = OptionalExportMetadataStringNormalizer.NormalizeOptionalString(value);
        if (normalized is null)
            return CompareInputFingerprints.AlgorithmVersion;

        return string.Equals(normalized, CompareInputFingerprints.AlgorithmVersion, StringComparison.Ordinal)
            ? normalized
            : CompareInputFingerprints.AlgorithmVersion;
    }
}
