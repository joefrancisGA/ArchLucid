using ArchLucid.Contracts.Governance.PolicyPacks;

namespace ArchLucid.Contracts.Manifest;

/// <summary>
///     Wave-10 suggestion 97: shared canonical create-time pin projection for Hasher A and Hasher B.
/// </summary>
public static class ManifestCreateTimePinCanonicalProjection
{
    public static object[] ProjectPolicyPackPins(IReadOnlyList<PinnedPolicyPackRow> rows) =>
        rows
            .OrderBy(static row => row.PolicyPackId, StringComparer.OrdinalIgnoreCase)
            .ThenBy(static row => row.PolicyPackVersion, StringComparer.Ordinal)
            .Select(static row => new
            {
                row.PolicyPackId,
                row.PolicyPackVersion,
                row.BlockCommitOnCritical,
                row.BlockCommitMinimumSeverity,
            })
            .ToArray();

    public static object[] ProjectEvidencePackagePins(IReadOnlyList<PinnedEvidencePackageRow> rows) =>
        rows
            .OrderBy(static row => row.Provider, StringComparer.OrdinalIgnoreCase)
            .ThenBy(static row => row.PackageId)
            .Select(static row => new { row.Provider, row.PackageId, row.CollectionUtc })
            .ToArray();
}
