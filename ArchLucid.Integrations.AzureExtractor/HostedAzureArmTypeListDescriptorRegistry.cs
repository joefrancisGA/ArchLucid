namespace ArchLucid.Integrations.AzureExtractor;

/// <summary>
///     Unified lookup for IE-RF network and AX-DE PaaS type-scoped subscription list descriptors.
/// </summary>
internal static class HostedAzureArmTypeListDescriptorRegistry
{
    internal static bool TryGet(string resourceType, out HostedAzureArmTypeListDescriptor descriptor)
    {
        descriptor = default!;

        if (string.IsNullOrWhiteSpace(resourceType))
        {
            return false;
        }

        HostedAzureArmTypeListDescriptor? found = HostedAzureArmNetworkTypeListDescriptors.SubscriptionLists
            .Concat(HostedAzureArmPaasTypeListDescriptors.SubscriptionLists)
            .FirstOrDefault(candidate =>
                candidate.ResourceType.Equals(resourceType.Trim(), StringComparison.OrdinalIgnoreCase));

        if (found is null)
        {
            return false;
        }

        descriptor = found;

        return true;
    }
}
