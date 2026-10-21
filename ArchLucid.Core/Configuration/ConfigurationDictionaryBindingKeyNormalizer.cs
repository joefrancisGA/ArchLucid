namespace ArchLucid.Core.Configuration;

/// <summary>
///     Trims configuration-bound dictionary keys so lookups that trim runtime labels (plan ids, deployment names)
///     still match entries bound from appsettings or Key Vault.
/// </summary>
internal static class ConfigurationDictionaryBindingKeyNormalizer
{
    public static Dictionary<string, TValue>? NormalizeTrimmedKeys<TValue>(
        Dictionary<string, TValue>? source,
        IEqualityComparer<string>? comparer = null)
    {
        if (source is not { Count: > 0 })
            return source;

        Dictionary<string, TValue> normalized = new(comparer ?? source.Comparer);

        foreach (KeyValuePair<string, TValue> entry in source)
        {

            if (string.IsNullOrWhiteSpace(entry.Key))
                continue;

            normalized[entry.Key.Trim()] = entry.Value;
        }

        return normalized;
    }

    public static Dictionary<string, string>? NormalizeTrimmedKeysAndStringValues(Dictionary<string, string>? source)
    {
        if (source is not { Count: > 0 })
            return source;

        Dictionary<string, string> normalized = new(source.Comparer);

        foreach (KeyValuePair<string, string> entry in source)
        {

            if (string.IsNullOrWhiteSpace(entry.Key))
                continue;

            string key = entry.Key.Trim();
            string value = entry.Value is null ? string.Empty : entry.Value.Trim();
            normalized[key] = value;
        }

        return normalized;
    }
}
