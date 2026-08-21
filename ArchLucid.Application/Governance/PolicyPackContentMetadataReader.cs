namespace ArchLucid.Application.Governance;

/// <summary>
///     Reads policy pack content metadata without assuming dictionary comparer casing after JSON deserialization.
/// </summary>
internal static class PolicyPackContentMetadataReader
{
    internal static bool TryGetValue(
        IReadOnlyDictionary<string, string> metadata,
        string key,
        out string? value)
    {
        ArgumentNullException.ThrowIfNull(metadata);
        ArgumentException.ThrowIfNullOrWhiteSpace(key);

        if (metadata.TryGetValue(key, out value))
            return true;

        foreach (KeyValuePair<string, string> entry in metadata)
        {
            if (string.Equals(entry.Key, key, StringComparison.OrdinalIgnoreCase))
            {
                value = entry.Value;
                return true;
            }
        }

        value = null;
        return false;
    }
}
