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

        // JSON `"engineFailures": null` / `"checklistCoverage": null` must not wipe list defaults —
        // buyer-summary coverage projection and commit classifier throw on null EngineFailures.
        snapshot.EngineFailures = header.EngineFailures ?? [];
        snapshot.EvaluationConfidenceEnrichmentSkipped = header.EvaluationConfidenceEnrichmentSkipped;
        snapshot.GenerationStatus = header.GenerationStatus;
        snapshot.ChecklistCoverage = header.ChecklistCoverage ?? [];
        snapshot.InsightDensityCuration = header.InsightDensityCuration;
    }
}
