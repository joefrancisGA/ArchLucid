using ArchLucid.Contracts.Persistence.Context;

namespace ArchLucid.ContextIngestion.Infrastructure.Canonical;

/// <summary>
///     Shared property bag reads for canonical infrastructure objects and downstream mappers.
/// </summary>
public static class CanonicalObjectPropertyReader
{
    public static string? TryGetProperty(CanonicalObject canonicalObject, string key)
    {
        ArgumentNullException.ThrowIfNull(canonicalObject);

        return TryGetProperty(canonicalObject.Properties, key);
    }

    public static string? TryGetProperty(IReadOnlyDictionary<string, string> properties, string key)
    {
        ArgumentNullException.ThrowIfNull(properties);

        if (!properties.TryGetValue(key, out string? value))
            return null;

        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
