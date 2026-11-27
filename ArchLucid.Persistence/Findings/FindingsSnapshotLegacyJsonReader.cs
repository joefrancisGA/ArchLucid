using ArchLucid.Persistence.Serialization;

namespace ArchLucid.Persistence.Findings;

/// <summary>
///     Deserializes <c>FindingsJson</c> (full <see cref="FindingsSnapshot" /> blob) when relational
///     <c>FindingRecords</c> are absent.
/// </summary>
internal static class FindingsSnapshotLegacyJsonReader
{
    internal static List<Finding> DeserializeFindings(string? findingsJson) =>
        DeserializeFindings(findingsJson, out _);

    internal static List<Finding> DeserializeFindings(string? findingsJson, out bool hasRecordedOutput)
    {
        hasRecordedOutput = false;

        if (string.IsNullOrWhiteSpace(findingsJson))
            return [];

        try
        {
            FindingsSnapshot snap = JsonEntitySerializer.Deserialize<FindingsSnapshot>(findingsJson);
            hasRecordedOutput = snap.HasRecordedGenerationStatus && snap.FindingsSnapshotId != Guid.Empty;

            return snap.Findings.Count == 0 ? [] : snap.Findings.ToList();
        }
        catch (InvalidOperationException)
        {
            return [];
        }
    }
}
