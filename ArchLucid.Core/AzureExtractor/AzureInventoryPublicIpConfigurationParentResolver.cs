namespace ArchLucid.Core.AzureExtractor;

/// <summary>Resolves the resource that owns an Azure public-IP configuration id.</summary>
public static class AzureInventoryPublicIpConfigurationParentResolver
{
    public static string? TryResolveParentArmId(string? configurationId)
    {
        if (string.IsNullOrWhiteSpace(configurationId))
        {
            return null;
        }

        string working = configurationId.Trim();

        const int maxPercentDecodePasses = 8;

        for (int pass = 0; pass < maxPercentDecodePasses && working.Contains('%', StringComparison.Ordinal); pass++)
        {
            string decoded = Uri.UnescapeDataString(working);

            if (string.Equals(decoded, working, StringComparison.Ordinal))
            {
                break;
            }

            working = decoded;
        }

        string[] segments = working
            .Split('/', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        for (int index = segments.Length - 2; index >= 0; index--)
        {
            if (!segments[index].EndsWith("ipConfigurations", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            return "/" + string.Join("/", segments.Take(index));
        }

        return null;
    }
}
