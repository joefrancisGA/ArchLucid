using ArchLucid.Contracts.Persistence.Artifacts;
using ArchLucid.Core.Diagnostics;

namespace ArchLucid.Core.Artifacts;

/// <summary>
///     Collapses duplicate artifact bundle rows per <see cref="SynthesizedArtifact.ArtifactId" /> with a stable rule
///     when <c>ContentHash</c> values disagree (legacy JSON bundles; relational storage enforces uniqueness per bundle).
/// </summary>
public static class SynthesizedArtifactBundleCanonicalizer
{
    public static SynthesizedArtifactBundleCanonicalizationResult Canonicalize(
        IReadOnlyList<SynthesizedArtifact> artifacts)
    {
        ArgumentNullException.ThrowIfNull(artifacts);

        if (artifacts.Count == 0)
        {
            return new SynthesizedArtifactBundleCanonicalizationResult { Artifacts = [] };
        }

        List<SynthesizedArtifactBundleConflict> conflicts = [];
        List<SynthesizedArtifact> canonical = [];

        foreach (IGrouping<Guid, SynthesizedArtifact> group in artifacts.GroupBy(static artifact => artifact.ArtifactId))
        {
            List<string> distinctHashes = group
                .Select(static artifact => artifact.ContentHash ?? string.Empty)
                .Distinct(StringComparer.Ordinal)
                .ToList();

            if (distinctHashes.Count > 1)
            {
                conflicts.Add(new SynthesizedArtifactBundleConflict
                {
                    ArtifactId = group.Key,
                    ContentHashes = distinctHashes,
                });
            }

            canonical.Add(SelectCanonicalRow(group));
        }

        if (conflicts.Count > 0)
            ArchLucidInstrumentation.RecordProvenanceArtifactBundleDuplicateArtifactIdConflicts(conflicts.Count);

        return new SynthesizedArtifactBundleCanonicalizationResult
        {
            Artifacts = canonical,
            Conflicts = conflicts,
        };
    }

    public static IReadOnlyList<SynthesizedArtifact> DistinctByArtifactId(IReadOnlyList<SynthesizedArtifact> artifacts) =>
        Canonicalize(artifacts).Artifacts;

    private static SynthesizedArtifact SelectCanonicalRow(IGrouping<Guid, SynthesizedArtifact> group) =>
        group
            .OrderByDescending(static artifact => artifact.ContentHash ?? string.Empty, StringComparer.Ordinal)
            .First();
}
