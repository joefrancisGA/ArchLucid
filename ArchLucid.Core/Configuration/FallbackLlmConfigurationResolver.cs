namespace ArchLucid.Core.Configuration;

/// <summary>Resolves ordered fallback AOAI endpoints from <see cref="FallbackLlmOptions" /> for host registration.</summary>
public static class FallbackLlmConfigurationResolver
{
    /// <summary>
    ///     When <paramref name="options"/>.<see cref="FallbackLlmOptions.Enabled"/> is false, returns an empty list.
    ///     Otherwise returns <see cref="FallbackLlmOptions.Endpoints"/> entries that have endpoint, deployment, and
    ///     either an API key or <see cref="FallbackLlmEndpointOptions.UseManagedIdentity"/>; if that list is empty,
    ///     falls back to the legacy single Endpoint/ApiKey/DeploymentName triple.
    /// </summary>
    public static IReadOnlyList<FallbackLlmResolvedEndpoint> ResolveOrderedEndpoints(FallbackLlmOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        if (!options.Enabled)
            return Array.Empty<FallbackLlmResolvedEndpoint>();

        List<FallbackLlmResolvedEndpoint> list = new();

        if (options.Endpoints is { Count: > 0 })
        {
            foreach (FallbackLlmEndpointOptions row in options.Endpoints)
            {
                if (row is null)
                    continue;

                if (!TryCreate(row, out FallbackLlmResolvedEndpoint? resolved) || resolved is null)
                    continue;

                list.Add(resolved);
            }

            if (list.Count > 0)
                return list;
        }

        if (TryCreateLegacy(options, out FallbackLlmResolvedEndpoint? legacy) && legacy is not null)
            list.Add(legacy);

        if (list.Count == 0)
            throw new InvalidOperationException(
                "ArchLucid:FallbackLlm is enabled but no complete endpoint entries were found. "
                + "Set ArchLucid:FallbackLlm:Endpoints[...] with Endpoint, DeploymentName, and either ApiKey or "
                + "UseManagedIdentity=true, or configure the legacy FallbackLlm:Endpoint, ApiKey, and DeploymentName properties.");

        return list;
    }

    private static bool TryCreate(FallbackLlmEndpointOptions row, out FallbackLlmResolvedEndpoint? resolved)
    {
        string endpoint = row.Endpoint?.Trim() ?? string.Empty;
        string apiKey = row.ApiKey?.Trim() ?? string.Empty;
        string deployment = row.DeploymentName?.Trim() ?? string.Empty;

        resolved = null;

        if (endpoint.Length == 0 || deployment.Length == 0)
            return false;

        if (row.UseManagedIdentity)
        {
            resolved = new FallbackLlmResolvedEndpoint
            {
                Endpoint = endpoint,
                DeploymentName = deployment,
                ApiKey = string.Empty,
                UseManagedIdentity = true,
            };

            return true;
        }

        if (apiKey.Length == 0)
            return false;

        resolved = new FallbackLlmResolvedEndpoint
        {
            Endpoint = endpoint,
            DeploymentName = deployment,
            ApiKey = apiKey,
            UseManagedIdentity = false,
        };

        return true;
    }

    private static bool TryCreateLegacy(FallbackLlmOptions row, out FallbackLlmResolvedEndpoint? resolved)
    {
#pragma warning disable CS0618 // Intentional legacy flat-property fallback for older configs.
        string endpoint = row.Endpoint?.Trim() ?? string.Empty;
        string apiKey = row.ApiKey?.Trim() ?? string.Empty;
        string deployment = row.DeploymentName?.Trim() ?? string.Empty;
#pragma warning restore CS0618

        resolved = null;

        if (endpoint.Length == 0 || apiKey.Length == 0 || deployment.Length == 0)
            return false;

        resolved = new FallbackLlmResolvedEndpoint
        {
            Endpoint = endpoint,
            DeploymentName = deployment,
            ApiKey = apiKey,
            UseManagedIdentity = false,
        };

        return true;
    }
}
