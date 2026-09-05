using ArchLucid.Contracts.Governance.Coverage;

namespace ArchLucid.Application.Governance.Coverage;

/// <summary>Applies operator per-run coverage exclusions consistently across preview and execute.</summary>
public static class RunCoverageOverrideApplicator
{
    public const string DefaultUserExclusionReason =
        "Operator excluded this policy pack for this review.";

    public static bool TryGetUserExclusion(
        Guid policyPackId,
        IReadOnlyDictionary<Guid, RunCoverageAcknowledgementEntry>? acknowledgements,
        out string? exclusionReason)
    {
        exclusionReason = null;

        if (acknowledgements is null)
            return false;

        if (!acknowledgements.TryGetValue(policyPackId, out RunCoverageAcknowledgementEntry? entry))
            return false;

        if (!entry.Excluded)
            return false;

        exclusionReason = string.IsNullOrWhiteSpace(entry.ExclusionReason)
            ? DefaultUserExclusionReason
            : entry.ExclusionReason.Trim();

        return true;
    }

    public static bool TryGetPreviewExclusion(
        Guid policyPackId,
        IReadOnlyList<CoveragePreviewUserOverride>? previewOverrides,
        out string? exclusionReason)
    {
        exclusionReason = null;

        if (previewOverrides is null || previewOverrides.Count == 0)
            return false;

        CoveragePreviewUserOverride? match = previewOverrides.FirstOrDefault(row => row.PolicyPackId == policyPackId);

        if (match is null || !match.Excluded)
            return false;

        exclusionReason = string.IsNullOrWhiteSpace(match.ExclusionReason)
            ? DefaultUserExclusionReason
            : match.ExclusionReason.Trim();

        return true;
    }

    public static IReadOnlyDictionary<Guid, RunCoverageAcknowledgementEntry> ToAcknowledgementMap(
        RunAcknowledgedCoverageDocument? document)
    {
        if (document?.Entries is null || document.Entries.Count == 0)
            return new Dictionary<Guid, RunCoverageAcknowledgementEntry>();

        return document.Entries
            .GroupBy(entry => entry.PolicyPackId)
            .ToDictionary(group => group.Key, group => group.Last());
    }
}
