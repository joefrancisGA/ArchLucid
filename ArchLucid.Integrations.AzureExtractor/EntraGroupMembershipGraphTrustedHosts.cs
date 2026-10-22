namespace ArchLucid.Integrations.AzureExtractor;

internal static class EntraGroupMembershipGraphTrustedHosts
{
    public static bool IsTrusted(string? host)
    {
        if (string.IsNullOrWhiteSpace(host))
        {
            return false;
        }

        string normalized = host.Trim();

        return normalized.Equals("graph.microsoft.com", StringComparison.OrdinalIgnoreCase)
            || normalized.Equals("graph.microsoft.us", StringComparison.OrdinalIgnoreCase)
            || normalized.Equals("dod-graph.microsoft.us", StringComparison.OrdinalIgnoreCase)
            || normalized.Equals("graph.microsoft.de", StringComparison.OrdinalIgnoreCase)
            || normalized.Equals("microsoftgraph.chinacloudapi.cn", StringComparison.OrdinalIgnoreCase);
    }
}
