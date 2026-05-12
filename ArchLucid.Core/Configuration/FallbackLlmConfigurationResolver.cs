namespace ArchLucid.Core.Configuration;

/// <summary>Resolves ordered fallback AOAI endpoints from <see cref="FallbackLlmOptions" /> for host registration.</summary>
public static class FallbackLlmConfigurationResolver
{
    /// <summary>
    ///     When <paramref name="options"/>.<see cref="FallbackLlmOptions.Enabled"/> is false, returns an empty list.
    ///     Otherwise returns <see cref="FallbackLlmOptions.Endpoints"/> entries that have all three properties set; if that
    ///     list is empty, falls back to the legacy single <c>Endpoint</c>/<c>ApiKey</c>/<c>DeploymentName</c> triple.
    /// </summary>
    public static IReadOnlyList<(string Endpoint, string ApiKey, string DeploymentName)> ResolveOrderedEndpoints(
        FallbackLlmOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        if (!options.Enabled)
            return Array.Empty<(string, string, string)>();

        List<(string, string, string)> list = new();

        if (options.Endpoints is { Count: > 0 })
        {
            foreach (FallbackLlmEndpointOptions row in options.Endpoints)
            {
                if (row is null)
                    continue;

                if (!IsComplete(row, out string ep, out string key, out string dep))
                    continue;

                list.Add((ep, key, dep));
            }

            if (list.Count > 0)
                return list;
        }

        if (IsComplete(options, out string le, out string lk, out string ld))
            list.Add((le, lk, ld));

        if (list.Count == 0)
            throw new InvalidOperationException(
                "ArchLucid:FallbackLlm is enabled but no complete endpoint entries were found. "
                + "Set ArchLucid:FallbackLlm:Endpoints[...] with Endpoint, ApiKey, and DeploymentName, "
                + "or configure the legacy FallbackLlm:Endpoint, ApiKey, and DeploymentName properties.");

        return list;
    }

    private static bool IsComplete(FallbackLlmEndpointOptions row, out string endpoint, out string apiKey, out string deployment)
    {
        endpoint = row.Endpoint?.Trim() ?? string.Empty;
        apiKey = row.ApiKey?.Trim() ?? string.Empty;
        deployment = row.DeploymentName?.Trim() ?? string.Empty;

        return endpoint.Length > 0 && apiKey.Length > 0 && deployment.Length > 0;
    }

    private static bool IsComplete(FallbackLlmOptions row, out string endpoint, out string apiKey, out string deployment)
    {
        endpoint = row.Endpoint?.Trim() ?? string.Empty;
        apiKey = row.ApiKey?.Trim() ?? string.Empty;
        deployment = row.DeploymentName?.Trim() ?? string.Empty;

        return endpoint.Length > 0 && apiKey.Length > 0 && deployment.Length > 0;
    }
}
