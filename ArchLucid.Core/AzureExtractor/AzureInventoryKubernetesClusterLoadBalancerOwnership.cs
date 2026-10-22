using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>AKS Kubernetes service load balancer ownership from stored tags (NR-39).</summary>
public static class AzureInventoryKubernetesClusterLoadBalancerOwnership
{
    public const string KubernetesClusterNameTag = "kubernetes.io/cluster-name";

    public const string AksManagedClusterNameTag = "aks-managed-cluster-name";

    public static bool LoadBalancerTagsIndicateClusterOwnership(
        IReadOnlyDictionary<string, string>? loadBalancerTags,
        string managedClusterName,
        string normalizedManagedClusterResourceId)
    {
        if (loadBalancerTags is null || loadBalancerTags.Count == 0)
        {
            return false;
        }

        if (string.IsNullOrWhiteSpace(managedClusterName)
            || string.IsNullOrWhiteSpace(normalizedManagedClusterResourceId))
        {
            return false;
        }

        string clusterName = managedClusterName.Trim();
        string clusterId = ArmResourceIdNormalizer.Normalize(normalizedManagedClusterResourceId);

        foreach (KeyValuePair<string, string> tag in loadBalancerTags)
        {
            if (!tag.Key.Equals(KubernetesClusterNameTag, StringComparison.OrdinalIgnoreCase)
                && !tag.Key.Equals(AksManagedClusterNameTag, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            string tagValue = tag.Value.Trim();

            if (tagValue.Length == 0)
            {
                continue;
            }

            if (tag.Key.Equals(KubernetesClusterNameTag, StringComparison.OrdinalIgnoreCase))
            {
                if (tagValue.Equals(clusterName, StringComparison.OrdinalIgnoreCase)
                    || tagValue.Equals(clusterId, StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }

                continue;
            }

            if (tagValue.Equals(clusterName, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }

    public static string? TryReadManagedClusterNameFromResourceId(string? managedClusterResourceId)
    {
        if (string.IsNullOrWhiteSpace(managedClusterResourceId))
        {
            return null;
        }

        string normalized = managedClusterResourceId.Trim().TrimEnd('/');
        int lastSlash = normalized.LastIndexOf('/');

        if (lastSlash < 0 || lastSlash >= normalized.Length - 1)
        {
            return null;
        }

        return normalized[(lastSlash + 1)..];
    }
}
