namespace ArchLucid.Integrations.AwsExtractor;

internal static class AwsResourceExplorerQueryString
{
    public static string ResolveForRegion(string regionSystemName)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(regionSystemName);

        if (regionSystemName.StartsWith("us-gov-", StringComparison.OrdinalIgnoreCase))
            return "arn:aws-us-gov:*";

        if (regionSystemName.StartsWith("cn-", StringComparison.OrdinalIgnoreCase))
            return "arn:aws-cn:*";

        return "arn:aws:*";
    }
}
