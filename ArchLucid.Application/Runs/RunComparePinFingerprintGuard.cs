using ArchLucid.Core.Comparison;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Runs;

/// <summary>
///     Wave-12 suggestion 114: manifest compare requires matching create-time pin fingerprints on both runs.
/// </summary>
public static class RunComparePinFingerprintGuard
{
    public static void EnsureCreateTimePinFingerprintsMatchOrThrow(RunRecord left, RunRecord right)
    {
        ArgumentNullException.ThrowIfNull(left);
        ArgumentNullException.ThrowIfNull(right);

        EnsureBytesMatchOrThrow(
            left.PinnedPolicyPackIdsHashSha256,
            right.PinnedPolicyPackIdsHashSha256,
            "policy pack pin hash");

        EnsureBytesMatchOrThrow(
            left.PinnedEvidencePackagePinsHashSha256,
            right.PinnedEvidencePackagePinsHashSha256,
            "evidence package pin hash");

        EnsureBytesMatchOrThrow(
            left.PinnedArchitectureVersionContentHashSha256,
            right.PinnedArchitectureVersionContentHashSha256,
            "architecture version content hash");

        EnsureBytesMatchOrThrow(
            left.PinnedKnowledgeModelContentHashSha256,
            right.PinnedKnowledgeModelContentHashSha256,
            "knowledge model content hash");

        EnsureFocusedPilotMatchOrThrow(left, right);
    }

    /// <summary>Wave-16 suggestion 156: manifest compare requires matching committed artifact inventory fingerprints.</summary>
    public static void EnsureCommittedArtifactInventoryFingerprintsMatchOrThrow(
        string? leftInventoryHashSha256,
        string? rightInventoryHashSha256)
    {
        EnsureOptionalHexMatchOrThrow(
            leftInventoryHashSha256,
            rightInventoryHashSha256,
            "committed artifact inventory hash");
    }

    private static void EnsureOptionalHexMatchOrThrow(string? left, string? right, string label)
    {
        bool leftEmpty = string.IsNullOrWhiteSpace(left);
        bool rightEmpty = string.IsNullOrWhiteSpace(right);

        if (leftEmpty && rightEmpty)
            return;

        if (leftEmpty || rightEmpty || !string.Equals(left, right, StringComparison.OrdinalIgnoreCase))
        {
            throw new ConflictException(
                $"Compare blocked: {label} differs between the selected runs.");
        }
    }

    private static void EnsureFocusedPilotMatchOrThrow(RunRecord left, RunRecord right)
    {
        if (left.PinnedFocusedPilotModeEnabled != right.PinnedFocusedPilotModeEnabled)
        {
            throw new ConflictException(
                "Compare blocked: focused-pilot mode pin differs between the selected runs.");
        }

        if (left.PinnedFocusedPilotCloudProvider != right.PinnedFocusedPilotCloudProvider)
        {
            throw new ConflictException(
                "Compare blocked: focused-pilot cloud provider pin differs between the selected runs.");
        }
    }

    public static CompareInputFingerprints BuildCompareInputFingerprints(
        RunRecord? baseHeader,
        RunRecord? targetHeader,
        string? baseManifestHash,
        string? targetManifestHash,
        string? baseCommittedArtifactInventoryHashSha256 = null,
        string? targetCommittedArtifactInventoryHashSha256 = null)
    {
        return new CompareInputFingerprints
        {
            BasePolicyPackPinHashSha256 = RunHeaderPinFingerprint.ToHexOrNull(baseHeader?.PinnedPolicyPackIdsHashSha256),
            TargetPolicyPackPinHashSha256 = RunHeaderPinFingerprint.ToHexOrNull(targetHeader?.PinnedPolicyPackIdsHashSha256),
            BaseEvidencePackagePinHashSha256 = RunHeaderPinFingerprint.ToHexOrNull(baseHeader?.PinnedEvidencePackagePinsHashSha256),
            TargetEvidencePackagePinHashSha256 = RunHeaderPinFingerprint.ToHexOrNull(targetHeader?.PinnedEvidencePackagePinsHashSha256),
            BaseArchitectureVersionContentHashSha256 =
                RunHeaderPinFingerprint.ToHexOrNull(baseHeader?.PinnedArchitectureVersionContentHashSha256),
            TargetArchitectureVersionContentHashSha256 =
                RunHeaderPinFingerprint.ToHexOrNull(targetHeader?.PinnedArchitectureVersionContentHashSha256),
            BaseKnowledgeModelContentHashSha256 =
                RunHeaderPinFingerprint.ToHexOrNull(baseHeader?.PinnedKnowledgeModelContentHashSha256),
            TargetKnowledgeModelContentHashSha256 =
                RunHeaderPinFingerprint.ToHexOrNull(targetHeader?.PinnedKnowledgeModelContentHashSha256),
            BaseManifestHashSha256 = baseManifestHash,
            TargetManifestHashSha256 = targetManifestHash,
            BaseCommittedArtifactInventoryHashSha256 = baseCommittedArtifactInventoryHashSha256,
            TargetCommittedArtifactInventoryHashSha256 = targetCommittedArtifactInventoryHashSha256,
        };
    }

    private static void EnsureBytesMatchOrThrow(byte[]? left, byte[]? right, string label)
    {
        bool leftEmpty = left is null || left.Length == 0;
        bool rightEmpty = right is null || right.Length == 0;

        if (leftEmpty && rightEmpty)
            return;

        if (leftEmpty || rightEmpty || !left.AsSpan().SequenceEqual(right))
        {
            throw new ConflictException(
                $"Compare blocked: create-time {label} differs between the selected runs.");
        }
    }
}
