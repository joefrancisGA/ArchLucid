namespace ArchLucid.KnowledgeGraph;

/// <summary>
///     Reads graph node property bag keys without assuming dictionary comparer casing.
/// </summary>
internal static class GraphNodePropertyReader
{
    internal static bool TryGetPropertyValue(
        IReadOnlyDictionary<string, string> properties,
        string key,
        out string? value)
    {
        ArgumentNullException.ThrowIfNull(properties);
        ArgumentException.ThrowIfNullOrWhiteSpace(key);

        foreach (KeyValuePair<string, string> entry in properties)
        {
            if (string.Equals(entry.Key, key, StringComparison.OrdinalIgnoreCase)
                && !string.IsNullOrWhiteSpace(entry.Value))
            {
                value = entry.Value;
                return true;
            }
        }

        value = null;
        return false;
    }
}
