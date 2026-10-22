using ArchLucid.Core.AzureExtractor;

namespace ArchLucid.Integrations.AzureExtractor;

internal static class HostedAzureInventoryPrivateLinkOnlyNicCatalog
{
    public static HashSet<string> BuildOmittedNicArmIds(IReadOnlyList<HostedAzureArmResourceRecord> resources)
    {
        ArgumentNullException.ThrowIfNull(resources);

        IEnumerable<AzureInventoryNicContextResource> contextResources = resources.Select(static resource =>
        {
            Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase);

            foreach (KeyValuePair<string, object?> property in resource.Properties)
            {
                string? text = property.Value?.ToString();

                if (!string.IsNullOrWhiteSpace(text))
                {
                    properties[property.Key] = text;
                }
            }

            return new AzureInventoryNicContextResource(
                resource.ResourceType,
                resource.ResourceId,
                properties);
        });

        return AzureInventoryPrivateLinkOnlyNicCatalog.BuildOmittedNicArmIdsFromInventoryResources(contextResources);
    }
}
