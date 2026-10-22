namespace ArchLucid.Decisioning.Analysis;

public static partial class DeclarationSecurityBaselineClassifier
{
    private static bool IsPublicLoadBalancerService(IReadOnlyDictionary<string, string> properties)
    {
        if (!TryGetProperty(properties, "k8s.servicetype", out string? serviceType))
            return false;

        return string.Equals(serviceType, "loadbalancer", StringComparison.OrdinalIgnoreCase);
    }
}
