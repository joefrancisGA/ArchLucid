using ArchLucid.Contracts.Persistence.DecisionTraces;

namespace ArchLucid.Provenance;

/// <summary>
///     Collapses duplicate artifact bundle rows per <see cref="SynthesizedArtifact.ArtifactId" /> with a stable rule
///     so revision fingerprints and provenance edges do not depend on row order when content hashes disagree.
/// </summary>
internal static class ProvenanceArtifactBundleCanonicalizer
{
    public static IEnumerable<SynthesizedArtifact> DistinctByArtifactId(IReadOnlyList<SynthesizedArtifact> artifacts) =>
        artifacts
            .GroupBy(static artifact => artifact.ArtifactId)
            .Select(SelectCanonicalRow);

    private static SynthesizedArtifact SelectCanonicalRow(IGrouping<Guid, SynthesizedArtifact> group) =>
        group
            .OrderByDescending(static artifact => artifact.ContentHash ?? string.Empty, StringComparer.Ordinal)
            .First();
}
