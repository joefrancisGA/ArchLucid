namespace ArchLucid.ContextIngestion.Infrastructure;

/// <summary>
///     Shared identity suffixes for JSON infrastructure resources that share
///     <c>resourceType</c> and <c>Name</c> but differ by <c>subtype</c>, <c>region</c>, or custom properties.
/// </summary>
public static class InfrastructureDeclarationResourceIdentity
{
    private static readonly HashSet<string> IdentityPropertyExclusions = new(StringComparer.OrdinalIgnoreCase)
    {
        "resourceType",
        "subtype",
        "region",
        "terraformType",
        "k8s.kind",
        "terraformOccurrence",
        "bicepOccurrence",
    };

    public static string ForJsonResource(
        string resourceType,
        string name,
        IReadOnlyDictionary<string, string> properties)
    {
        string identity = $"{resourceType}|{name}";

        return AppendSubtypeRegionDisambiguators(identity, properties);
    }

    public static string AppendSubtypeRegionDisambiguators(
        string key,
        IReadOnlyDictionary<string, string> properties)
    {
        ArgumentNullException.ThrowIfNull(key);
        ArgumentNullException.ThrowIfNull(properties);

        if (TryGetCanonicalProperty(properties, "subtype", out string? subtype))
            key += $"|subtype:{subtype}";

        if (TryGetCanonicalProperty(properties, "region", out string? region))
            key += $"|region:{region}";

        return AppendCustomPropertyDisambiguators(key, properties);
    }

    public static string BuildResourceTypeFingerprint(IReadOnlyDictionary<string, string> properties)
    {
        ArgumentNullException.ThrowIfNull(properties);

        if (!properties.TryGetValue("resourceType", out string? resourceType) ||
            string.IsNullOrWhiteSpace(resourceType))
            return string.Empty;

        return AppendSubtypeRegionDisambiguators(resourceType.Trim().ToLowerInvariant(), properties);
    }

    private static string AppendCustomPropertyDisambiguators(
        string key,
        IReadOnlyDictionary<string, string> properties)
    {
        List<string> segments = properties
            .Where(static kv => !IdentityPropertyExclusions.Contains(kv.Key))
            .Where(static kv => !string.IsNullOrWhiteSpace(kv.Value))
            .OrderBy(static kv => kv.Key, StringComparer.OrdinalIgnoreCase)
            .Select(static kv => $"{kv.Key.Trim().ToLowerInvariant()}:{kv.Value.Trim().ToLowerInvariant()}")
            .ToList();

        if (segments.Count == 0)
            return key;

        return $"{key}|props:{string.Join(',', segments)}";
    }

    private static bool TryGetCanonicalProperty(
        IReadOnlyDictionary<string, string> properties,
        string key,
        out string? canonicalValue)
    {
        canonicalValue = null;

        if (!properties.TryGetValue(key, out string? value) || string.IsNullOrWhiteSpace(value))
            return false;

        canonicalValue = value.Trim().ToLowerInvariant();

        return true;
    }
}
