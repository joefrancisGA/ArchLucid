using ArchLucid.Persistence.Serialization;

namespace ArchLucid.Persistence.Findings;

/// <summary>Merges snapshot header fields stored only in <c>FindingsJson</c> onto relational read models.</summary>
internal static class FindingsSnapshotMetadataMerger
{
    internal static void MergeFromFindingsJson(FindingsSnapshot snapshot, string? findingsJson)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        if (string.IsNullOrWhiteSpace(findingsJson))
            return;

        FindingsSnapshot? header = JsonEntitySerializer.Deserialize<FindingsSnapshot>(findingsJson);

        snapshot.EngineFailures = header.EngineFailures;
        snapshot.EvaluationConfidenceEnrichmentSkipped = header.EvaluationConfidenceEnrichmentSkipped;
        snapshot.GenerationStatus = header.GenerationStatus;
    }
}
