namespace ArchLucid.Integrations.AzureExtractor;

internal static class HostedAzureArmTrustedManagementHosts
{
    public static bool IsTrusted(string? host)
    {
        if (string.IsNullOrWhiteSpace(host))
        {
            return false;
        }

        string normalized = host.Trim();

        return normalized.Equals("management.azure.com", StringComparison.OrdinalIgnoreCase)
            || normalized.Equals("management.usgovcloudapi.net", StringComparison.OrdinalIgnoreCase)
            || normalized.Equals("management.microsoftazure.de", StringComparison.OrdinalIgnoreCase)
            || normalized.Equals("management.chinacloudapi.cn", StringComparison.OrdinalIgnoreCase);
    }
}
