using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Persistence.Serialization;

namespace ArchLucid.Persistence.GoldenManifests;

internal static partial class GoldenManifestPhase1RelationalRead
{
    /// <summary>Falls back to the legacy JSON column when no relational rows exist for a string list slice.</summary>
    private static List<string> FallbackDeserializeList(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return [];

        try
        {
            return JsonEntitySerializer.Deserialize<List<string>>(json) ?? [];
        }
        catch (InvalidOperationException)
        {
            return [];
        }
    }

    /// <summary>Falls back to the legacy JSON column when no relational provenance rows exist.</summary>
    private static ManifestProvenance FallbackDeserializeProvenance(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return new ManifestProvenance();

        try
        {
            return JsonEntitySerializer.Deserialize<ManifestProvenance>(json) ?? new ManifestProvenance();
        }
        catch (InvalidOperationException)
        {
            return new ManifestProvenance();
        }
    }

    /// <summary>Falls back to the legacy JSON column when no relational decision rows exist.</summary>
    internal static List<ResolvedArchitectureDecision> FallbackDeserializeDecisions(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return [];

        try
        {
            return JsonEntitySerializer.Deserialize<List<ResolvedArchitectureDecision>>(json) ?? [];
        }
        catch (InvalidOperationException)
        {
            return [];
        }
    }
}
