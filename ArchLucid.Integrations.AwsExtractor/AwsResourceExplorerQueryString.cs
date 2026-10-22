namespace ArchLucid.Integrations.AwsExtractor;

internal static class AwsResourceExplorerQueryString
{
    public static string ResolveForRegion(string regionSystemName)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(regionSystemName);

        if (regionSystemName.StartsWith("us-isob-", StringComparison.OrdinalIgnoreCase))
            return "arn:aws-iso-b:*";

        if (regionSystemName.StartsWith("us-isof-", StringComparison.OrdinalIgnoreCase))
            return "arn:aws-iso-f:*";

        if (regionSystemName.StartsWith("eu-isoe-", StringComparison.OrdinalIgnoreCase))
            return "arn:aws-iso-e:*";

        if (regionSystemName.StartsWith("us-iso-", StringComparison.OrdinalIgnoreCase))
            return "arn:aws-iso:*";

        if (regionSystemName.StartsWith("us-gov-", StringComparison.OrdinalIgnoreCase))
            return "arn:aws-us-gov:*";

        if (regionSystemName.StartsWith("cn-", StringComparison.OrdinalIgnoreCase))
            return "arn:aws-cn:*";

        return "arn:aws:*";
    }
}
