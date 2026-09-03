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
