namespace ArchLucid.Core.InfraEvidence;

/// <summary>Normalizes ARM resource identifiers for stable cross-snapshot joins.</summary>
public static class ArmResourceIdNormalizer
{
    /// <summary>
    ///     Maximum bounded passes applied when decoding percent-encoded ARM ids.
    /// </summary>
    public const int MaxPercentDecodePasses = 8;

    /// <summary>
    ///     Performs a bounded percent-decode of <paramref name="value"/>. Returns <see langword="true"/>
    ///     when decoding completed (or no decoding was needed) without throwing; returns
    ///     <see langword="false"/> and leaves <paramref name="decoded"/> as the last safe value when
    ///     <see cref="Uri.UnescapeDataString"/> fails on malformed input.
    /// </summary>
    public static bool TryDecodePercentEncoded(string? value, out string decoded)
    {
        decoded = string.Empty;

        if (string.IsNullOrWhiteSpace(value))
        {
            return true;
        }

        string working = value.Trim();

        for (int pass = 0; pass < MaxPercentDecodePasses && working.Contains('%', StringComparison.Ordinal); pass++)
        {
            string next;

            try
            {
                next = Uri.UnescapeDataString(working);
            }
            catch (UriFormatException)
            {
                decoded = working;
                return false;
            }

            if (string.Equals(next, working, StringComparison.Ordinal))
            {
                break;
            }

            working = next;
        }

        decoded = working;
        return true;
    }

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

    /// <summary>Returns the resource group segment from a top-level ARM resource id.</summary>
    public static bool TryGetResourceGroupName(string? azureResourceId, out string resourceGroupName)
    {
        resourceGroupName = string.Empty;

        if (string.IsNullOrWhiteSpace(azureResourceId))
        {
            return false;
        }

        string[] segments = azureResourceId
            .Trim()
            .TrimEnd('/')
            .Split('/', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        if (segments.Length < 4
            || !segments[0].Equals("subscriptions", StringComparison.OrdinalIgnoreCase)
            || !segments[2].Equals("resourceGroups", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        resourceGroupName = segments[3];

        return !string.IsNullOrWhiteSpace(resourceGroupName);
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
    /// <summary>
    ///     Walks nested <c>/type/name</c> pairs toward the subscription root.
    ///     Does not yield <paramref name="azureResourceId"/> itself.
    /// </summary>
    public static IEnumerable<string> EnumerateAncestorResourceIds(string? azureResourceId)
    {
        string walker = azureResourceId ?? string.Empty;
        HashSet<string> seen = new(StringComparer.OrdinalIgnoreCase);

        while (TryGetParentResourceId(walker, out string parent))
        {
            string normalized = Normalize(parent);

            if (normalized.Length == 0 || !seen.Add(normalized))
            {
                yield break;
            }

            yield return normalized;
            walker = parent;
        }
    }

    /// <summary>
    ///     Returns the nearest ARM ancestor that is present in <paramref name="visibleArmIds"/>.
    ///     Used when a nested child (subnet, database) was not captured as its own inventory row.
    /// </summary>
    public static bool TryResolveVisibleAncestorArmId(
        string? azureResourceId,
        IReadOnlySet<string> visibleArmIds,
        out string ancestorArmId)
    {
        ancestorArmId = string.Empty;

        if (visibleArmIds is null)
        {
            return false;
        }

        foreach (string ancestor in EnumerateAncestorResourceIds(azureResourceId))
        {
            if (visibleArmIds.Contains(ancestor))
            {
                ancestorArmId = ancestor;

                return true;
            }
        }

        return false;
    }
}
