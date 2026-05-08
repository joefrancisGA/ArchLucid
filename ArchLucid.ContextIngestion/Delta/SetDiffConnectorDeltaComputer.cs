using ArchLucid.ContextIngestion.Models;

namespace ArchLucid.ContextIngestion.Delta;

/// <summary>
///     Default <see cref="IConnectorDeltaComputer" /> that computes a set-diff over a caller-supplied stable key.
/// </summary>
/// <remarks>
///     <para>
///         Each <see cref="CanonicalObject" /> is identified by the result of <c>stableKeySelector</c>.
///         Keys must be unique within each list; duplicates cause the last writer to win (same as
///         <see cref="Enumerable.ToDictionary{TSource,TKey}" /> semantics).
///     </para>
///     <para>
///         "Modified" means the same key exists in both batches but the <see cref="CanonicalObject.Properties" />
///         dictionaries differ (key set or any value). Name and ObjectType changes are not tracked separately.
///     </para>
/// </remarks>
public sealed class SetDiffConnectorDeltaComputer : IConnectorDeltaComputer
{
    public ContextDelta Compute(
        IReadOnlyList<CanonicalObject> current,
        IReadOnlyList<CanonicalObject> previous,
        Func<CanonicalObject, string> stableKeySelector)
    {
        ArgumentNullException.ThrowIfNull(current);
        ArgumentNullException.ThrowIfNull(previous);
        ArgumentNullException.ThrowIfNull(stableKeySelector);

        if (previous.Count == 0)
            return BuildInitialDelta(current.Count);

        Dictionary<string, CanonicalObject> prevByKey = BuildIndex(previous, stableKeySelector);
        Dictionary<string, CanonicalObject> currByKey = BuildIndex(current, stableKeySelector);

        int added = currByKey.Keys.Count(k => !prevByKey.ContainsKey(k));
        int removed = prevByKey.Keys.Count(k => !currByKey.ContainsKey(k));

        IReadOnlyList<string> commonKeys = currByKey.Keys
            .Where(k => prevByKey.ContainsKey(k))
            .ToList();

        int modified = commonKeys.Count(k => !ArePropertiesEqual(currByKey[k], prevByKey[k]));
        int unchanged = commonKeys.Count - modified;

        return new ContextDelta
        {
            AddedCount = added,
            RemovedCount = removed,
            ModifiedCount = modified,
            UnchangedCount = unchanged,
            Summary = BuildDeltaSummary(added, removed, modified, unchanged)
        };
    }

    private static Dictionary<string, CanonicalObject> BuildIndex(
        IReadOnlyList<CanonicalObject> objects,
        Func<CanonicalObject, string> keySelector)
    {
        // Last writer wins on duplicate key; individual connectors should guarantee uniqueness.
        Dictionary<string, CanonicalObject> index = new(StringComparer.Ordinal);

        foreach (CanonicalObject obj in objects)
            index[keySelector(obj)] = obj;

        return index;
    }

    private static bool ArePropertiesEqual(CanonicalObject a, CanonicalObject b)
    {
        if (a.Properties.Count != b.Properties.Count)
            return false;

        foreach (KeyValuePair<string, string> kv in a.Properties)
        {
            if (!b.Properties.TryGetValue(kv.Key, out string? bVal) || bVal != kv.Value)
                return false;
        }

        return true;
    }

    private static ContextDelta BuildInitialDelta(int count)
        => new() { AddedCount = count, Summary = $"Initial ingestion: {count} item(s)" };

    private static string BuildDeltaSummary(int added, int removed, int modified, int unchanged)
        => $"+{added} added, -{removed} removed, {modified} modified, {unchanged} unchanged";
}
