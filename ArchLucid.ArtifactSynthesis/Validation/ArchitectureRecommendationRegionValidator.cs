namespace ArchLucid.ArtifactSynthesis.Validation;

/// <summary>
///     Cross-checks LLM-suggested Azure SKUs/services against a static region capability map.
/// </summary>
public static class ArchitectureRecommendationRegionValidator
{
    private static readonly HashSet<string> GlobalServices = new(StringComparer.OrdinalIgnoreCase)
    {
        "Microsoft.KeyVault/vaults",
        "Microsoft.Storage/storageAccounts",
        "Microsoft.Sql/servers",
        "Microsoft.Web/sites",
        "Microsoft.ContainerRegistry/registries",
    };

    /// <summary>Regions with limited service availability in the static map (extend as needed).</summary>
    private static readonly IReadOnlyDictionary<string, HashSet<string>> RegionRestrictedServices =
        new Dictionary<string, HashSet<string>>(StringComparer.OrdinalIgnoreCase)
        {
            ["qatarcentral"] = new(StringComparer.OrdinalIgnoreCase)
            {
                "Microsoft.CognitiveServices/accounts",
                "Microsoft.MachineLearningServices/workspaces",
            },
        };

    /// <summary>
    ///     Returns a <c>RegionMismatch</c> warning when the suggested service is unavailable in the tenant region.
    /// </summary>
    public static string? TryGetRegionMismatchWarning(string tenantRegion, string suggestedServiceOrSku)
    {
        if (string.IsNullOrWhiteSpace(tenantRegion) || string.IsNullOrWhiteSpace(suggestedServiceOrSku))
            return null;

        string normalizedRegion = tenantRegion.Trim().ToLowerInvariant();
        string normalizedSuggestion = suggestedServiceOrSku.Trim();

        if (GlobalServices.Contains(normalizedSuggestion))
            return null;

        if (!RegionRestrictedServices.TryGetValue(normalizedRegion, out HashSet<string>? restricted))
            return null;

        foreach (string restrictedService in restricted)
        {
            if (normalizedSuggestion.Contains(restrictedService, StringComparison.OrdinalIgnoreCase))
            {
                return $"RegionMismatch: '{normalizedSuggestion}' may not be available in region '{normalizedRegion}'.";
            }
        }

        return null;
    }
}
