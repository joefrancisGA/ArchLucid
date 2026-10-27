using ArchLucid.Application.Diffs;
using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Normalizes manifest diff sections on end-to-end comparison payloads before persist and rehydrate.
/// </summary>
internal static class ManifestDiffNormalizer
{
    internal static void NormalizeInPlace(ManifestDiffResult? diff)
    {
        if (diff is null)
            return;

        diff.LeftManifestVersion = NormalizeRequiredDisplayLabel(diff.LeftManifestVersion);
        diff.RightManifestVersion = NormalizeRequiredDisplayLabel(diff.RightManifestVersion);

        ComparisonPersistedStringListNormalizer.NormalizeInPlace(diff.AddedServices);
        ComparisonPersistedStringListNormalizer.NormalizeInPlace(diff.RemovedServices);
        ComparisonPersistedStringListNormalizer.NormalizeInPlace(diff.AddedDatastores);
        ComparisonPersistedStringListNormalizer.NormalizeInPlace(diff.RemovedDatastores);
        ComparisonPersistedStringListNormalizer.NormalizeInPlace(diff.AddedRequiredControls);
        ComparisonPersistedStringListNormalizer.NormalizeInPlace(diff.RemovedRequiredControls);
        ComparisonPersistedStringListNormalizer.NormalizeInPlace(diff.Warnings);

        NormalizeRelationshipsInPlace(diff.AddedRelationships);
        NormalizeRelationshipsInPlace(diff.RemovedRelationships);

        CompareInputFingerprintsNormalizer.NormalizeInPlace(diff.InputFingerprints);
    }

    private static void NormalizeRelationshipsInPlace(List<RelationshipDiffItem> relationships)
    {
        for (int i = relationships.Count - 1; i >= 0; i--)
        {
            RelationshipDiffItem item = relationships[i];
            item.SourceId = NormalizeRequiredDisplayLabel(item.SourceId);
            item.TargetId = NormalizeRequiredDisplayLabel(item.TargetId);
            item.RelationshipType = NormalizeRequiredDisplayLabel(item.RelationshipType);
            item.Description = OptionalExportMetadataStringNormalizer.NormalizeOptionalString(item.Description);

            if (item.SourceId.Length == 0 && item.TargetId.Length == 0 && item.RelationshipType.Length == 0)
                relationships.RemoveAt(i);
        }

        DedupeRelationshipsByEndpointPairInPlace(relationships);
    }

    private static void DedupeRelationshipsByEndpointPairInPlace(List<RelationshipDiffItem> relationships)
    {
        if (relationships.Count < 2)
            return;

        HashSet<(string SourceId, string TargetId, string RelationshipType)> seen = new();
        List<RelationshipDiffItem> distinct = [];

        foreach (RelationshipDiffItem item in relationships)
        {
            (string SourceId, string TargetId, string RelationshipType) key =
                (item.SourceId, item.TargetId, item.RelationshipType);

            if (!seen.Add(key))
                continue;

            distinct.Add(item);
        }

        if (distinct.Count == relationships.Count)
            return;

        relationships.Clear();
        relationships.AddRange(distinct);
    }

    private static string NormalizeRequiredDisplayLabel(string value) =>
        string.IsNullOrWhiteSpace(value) ? string.Empty : value.Trim();
}
