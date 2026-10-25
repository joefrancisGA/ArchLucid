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

        string normalizedKey = key.Trim();

        foreach (KeyValuePair<string, string> entry in properties)
        {
            if (string.IsNullOrWhiteSpace(entry.Key))
            {
                continue;
            }

            if (string.Equals(entry.Key.Trim(), normalizedKey, StringComparison.OrdinalIgnoreCase)
                && !string.IsNullOrWhiteSpace(entry.Value))
            {
                value = entry.Value.Trim();
                return true;
            }
        }

        value = null;
        return false;
    }
}
