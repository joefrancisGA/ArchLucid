namespace ArchLucid.Integrations.AzureExtractor;

public static class DefenderPlanCoverageWarnings
{
    private static readonly (string TypePrefix, string PricingName)[] PlanByResourceType =
    [
        ("Microsoft.Compute/virtualMachines", "VirtualMachines"),
        ("Microsoft.Sql/servers", "SqlServers"),
        ("Microsoft.Web/sites", "AppServices"),
        ("Microsoft.Storage/storageAccounts", "StorageAccounts"),
        ("Microsoft.KeyVault/vaults", "KeyVaults"),
        ("Microsoft.ContainerService/managedClusters", "Containers"),
        ("Microsoft.ApiManagement/service", "Api"),
    ];

    public static IReadOnlyList<string> Create(
        IReadOnlyList<HostedAzureArmDefenderPricingRecord> pricings,
        IReadOnlyList<HostedAzureArmResourceRecord> resources)
    {
        ArgumentNullException.ThrowIfNull(pricings);
        ArgumentNullException.ThrowIfNull(resources);

        HashSet<string> warnings = new(StringComparer.Ordinal);

        foreach (HostedAzureArmDefenderPricingRecord pricing in pricings)
        {
            if (!string.Equals(pricing.Tier, "Free", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            string? typePrefix = null;

            foreach ((string prefix, string pricingName) in PlanByResourceType)
            {
                if (string.Equals(pricingName, pricing.PricingName, StringComparison.OrdinalIgnoreCase))
                {
                    typePrefix = prefix;
                    break;
                }
            }

            if (typePrefix is null)
            {
                continue;
            }

            string subscriptionToken = $"/subscriptions/{pricing.SubscriptionId.Trim()}/";
            bool used = resources.Any(resource =>
                resource.ResourceId.Contains(subscriptionToken, StringComparison.OrdinalIgnoreCase)
                && TypeMatches(resource.ResourceType, typePrefix));

            if (used)
            {
                warnings.Add($"defender-plan-off:{pricing.PricingName}");
            }
        }

        return warnings.OrderBy(static warning => warning, StringComparer.Ordinal).ToArray();
    }

    private static bool TypeMatches(string resourceType, string typePrefix) =>
        resourceType.Equals(typePrefix, StringComparison.OrdinalIgnoreCase)
        || resourceType.StartsWith(typePrefix + "/", StringComparison.OrdinalIgnoreCase);
}
