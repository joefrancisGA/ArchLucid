using System.Text.Json;

namespace ArchLucid.Core.AiProviders;

/// <summary>Parses tier-to-deployment mappings stored on <see cref="TenantAzureOpenAiConnectionRecord.DeploymentsJson" />.</summary>
public static class TenantAzureOpenAiDeploymentsCatalog
{
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    public static string Serialize(IReadOnlyDictionary<string, string> deployments)
    {
        ArgumentNullException.ThrowIfNull(deployments);

        return JsonSerializer.Serialize(deployments, SerializerOptions);
    }

    public static bool TryParse(string? deploymentsJson, out IReadOnlyDictionary<string, string> deployments, out string? error)
    {
        deployments = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        error = null;

        if (string.IsNullOrWhiteSpace(deploymentsJson))
        {
            error = "DeploymentsJson is required.";

            return false;
        }

        try
        {
            Dictionary<string, string>? parsed =
                JsonSerializer.Deserialize<Dictionary<string, string>>(deploymentsJson.Trim(), SerializerOptions);

            if (parsed is null || parsed.Count == 0)
            {
                error = "DeploymentsJson must contain at least one tier-to-deployment mapping.";

                return false;
            }

            foreach ((string tier, string deployment) in parsed)
            {
                if (string.IsNullOrWhiteSpace(tier) || string.IsNullOrWhiteSpace(deployment))
                {
                    error = "Each deployment mapping must include a non-empty tier key and deployment name.";

                    return false;
                }
            }

            deployments = parsed.ToDictionary(
                static pair => pair.Key,
                static pair => pair.Value,
                StringComparer.OrdinalIgnoreCase);

            return true;
        }
        catch (JsonException)
        {
            error = "DeploymentsJson must be valid JSON object mapping tier names to deployment names.";

            return false;
        }
    }

    public static string ResolveDeploymentName(string? deploymentsJson, string tierDeploymentName)
    {
        if (!TryParse(deploymentsJson, out IReadOnlyDictionary<string, string> map, out _))
        {
            return tierDeploymentName;
        }

        if (map.TryGetValue("default", out string? defaultDeployment) && !string.IsNullOrWhiteSpace(defaultDeployment))
        {
            if (map.TryGetValue(tierDeploymentName, out string? exact) && !string.IsNullOrWhiteSpace(exact))
            {
                return exact.Trim();
            }

            return defaultDeployment.Trim();
        }

        if (map.TryGetValue(tierDeploymentName, out string? mapped) && !string.IsNullOrWhiteSpace(mapped))
        {
            return mapped.Trim();
        }

        return tierDeploymentName;
    }
}
