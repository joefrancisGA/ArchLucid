namespace ArchLucid.Core.InfraEvidence;

/// <summary>Normalizes ARM resource identifiers for stable cross-snapshot joins.</summary>
public static class ArmResourceIdNormalizer
{
    /// <summary>Lowercases and strips a trailing slash from an ARM resource id.</summary>
    public static string Normalize(string? externalResourceId)
    {
        if (string.IsNullOrWhiteSpace(externalResourceId))
            return string.Empty;

        ReadOnlySpan<char> trimmed = externalResourceId.AsSpan().Trim();

        if (trimmed.EndsWith('/'))
            trimmed = trimmed[..^1];

        return trimmed.ToString().ToLowerInvariant();
    }

    /// <summary>
    /// Returns whether <paramref name="descendantId"/> is a nested ARM child of <paramref name="ancestorId"/>.
    /// </summary>
    public static bool IsDescendantOf(string? descendantId, string? ancestorId)
    {
        string descendant = Normalize(descendantId);
        string ancestor = Normalize(ancestorId);

        if (descendant.Length == 0 || ancestor.Length == 0)
            return false;

        if (descendant.Length <= ancestor.Length)
            return false;

        return descendant.StartsWith(ancestor + "/", StringComparison.Ordinal);
    }

    /// <summary>
    ///     ARM ids nest in <c>/type/name</c> pairs after the provider. The parent of a nested child is
    ///     the id with that last pair removed — not the name-only prefix, which is not a resource.
    /// </summary>
    public static bool TryGetParentResourceId(string? azureResourceId, out string parentResourceId)
    {
        parentResourceId = string.Empty;

        if (string.IsNullOrWhiteSpace(azureResourceId))
        {
            return false;
        }

        string trimmed = azureResourceId.Trim().TrimEnd('/');
        string[] segments = trimmed.Split('/', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        // Top-level resources have 8 segments:
        // subscriptions/{id}/resourceGroups/{rg}/providers/{ns}/{type}/{name}.
        if (segments.Length < 10)
        {
            return false;
        }

        if (!segments[0].Equals("subscriptions", StringComparison.OrdinalIgnoreCase)
            || !segments[2].Equals("resourceGroups", StringComparison.OrdinalIgnoreCase)
            || !segments[4].Equals("providers", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        parentResourceId = "/" + string.Join('/', segments.Take(segments.Length - 2));

        return true;
    }
}
