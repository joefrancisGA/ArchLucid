using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Persistence.RelationalRead;
using ArchLucid.Persistence.Serialization;

namespace ArchLucid.Persistence.GoldenManifests;

internal static partial class GoldenManifestPhase1RelationalRead
{
    /// <summary>Falls back to the legacy JSON column when no relational rows exist for a string list slice.</summary>
    private static List<string> FallbackDeserializeList(string? json) =>
        RelationalSliceReadCore.DeserializeStringListOrEmpty(json);

    /// <summary>Falls back to the legacy JSON column when no relational provenance rows exist.</summary>
    private static ManifestProvenance FallbackDeserializeProvenance(string? json) =>
        RelationalSliceReadCore.DeserializeOrDefault(json, static () => new ManifestProvenance());

    /// <summary>Falls back to the legacy JSON column when no relational decision rows exist.</summary>
    internal static List<ResolvedArchitectureDecision> FallbackDeserializeDecisions(string? json) =>
        RelationalSliceReadCore.DeserializeListOrEmpty<ResolvedArchitectureDecision>(json);
}
