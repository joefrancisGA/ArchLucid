namespace ArchLucid.Core.Configuration;

/// <summary>Resolves Confluence space keys from <see cref="ConfluencePublishingOptions" /> using optional per-project routing.</summary>
public static class ConfluencePublishingSpaceKeyResolver
{
    /// <summary>Returns the space key for <paramref name="projectId" />, or the default <see cref="ConfluencePublishingOptions.SpaceKey" />.</summary>
    public static string Resolve(ConfluencePublishingOptions options, Guid projectId)
    {
        ArgumentNullException.ThrowIfNull(options);

        if (options.ProjectSpaceKeys is { Count: > 0 })
        {
            foreach (KeyValuePair<string, string> pair in options.ProjectSpaceKeys)
            {
                string? keyText = pair.Key?.Trim();
                string value = pair.Value?.Trim() ?? string.Empty;

                if (string.IsNullOrEmpty(keyText) || value.Length is 0)
                    continue;

                if (Guid.TryParse(keyText, out Guid mapped) && mapped == projectId)
                    return value;
            }
        }

        return options.SpaceKey.Trim();
    }
}
