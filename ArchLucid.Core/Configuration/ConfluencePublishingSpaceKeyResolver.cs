namespace ArchLucid.Core.Configuration;

/// <summary>Resolves Confluence space keys from <see cref="ConfluencePublishingOptions" /> using optional per-project routing.</summary>
public static class ConfluencePublishingSpaceKeyResolver
{
    /// <summary>Returns the space key for <paramref name="projectId" />, or the default <see cref="ConfluencePublishingOptions.SpaceKey" />.</summary>
    public static string Resolve(ConfluencePublishingOptions options, Guid projectId)
    {
        ArgumentNullException.ThrowIfNull(options);

        if (options.ProjectSpaceKeys is not { Count: > 0 })
            return TrimBound(options.SpaceKey);

        string? mappedSpaceKey = options.ProjectSpaceKeys
            .Select(pair => (Key: TrimBound(pair.Key), Value: TrimBound(pair.Value)))
            .Where(pair => pair.Value.Length > 0 && Guid.TryParse(pair.Key, out Guid mapped) && mapped == projectId)
            .Select(pair => pair.Value)
            .FirstOrDefault();

        if (!string.IsNullOrEmpty(mappedSpaceKey))
            return mappedSpaceKey;

        return TrimBound(options.SpaceKey);
    }

    /// <summary>
    /// Configuration binding keeps JSON null strings as null. Trimming those values
    /// throws while Confluence publish resolves a space key.
    /// </summary>
    private static string TrimBound(string? value)
    {
        if (value is null)
            return string.Empty;

        return value.Trim();
    }
}
