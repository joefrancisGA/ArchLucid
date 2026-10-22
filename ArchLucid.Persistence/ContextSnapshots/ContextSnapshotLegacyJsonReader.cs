using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Persistence.RelationalRead;

namespace ArchLucid.Persistence.ContextSnapshots;

/// <summary>Deserializes legacy JSON columns on <c>dbo.ContextSnapshots</c> when relational child rows are absent.</summary>
internal static class ContextSnapshotLegacyJsonReader
{
    internal static List<CanonicalObject> DeserializeCanonicalObjects(string? json) =>
        RelationalSliceReadCore.DeserializeListOrEmpty<CanonicalObject>(json);

    internal static List<string> DeserializeStringList(string? json) =>
        RelationalSliceReadCore.DeserializeStringListOrEmpty(json);

    internal static Dictionary<string, string> DeserializeSourceHashes(string? json) =>
        RelationalSliceReadCore.DeserializeOrdinalStringDictionaryOrEmpty(json);
}
