namespace ArchLucid.Core.Governance.PolicyPacks;

/// <summary>Stable bundled-pack slugs derived from embedded content filenames (basename without <c>.json</c>).</summary>
public static class PolicyPackBundledSlugs
{
    public const string SecurityArchitectureBaseline = "security-architecture-baseline";

    public const string ReliabilityAndResilience = "reliability-and-resilience";

    public const string CostOptimization = "cost-optimization";

    public const string PerformanceAndScalability = "performance-and-scalability";

    public const string OperationalExcellence = "operational-excellence";

    public const string SustainabilityAndResourceEfficiency = "sustainability-and-resource-efficiency";

    public const string AzureWellArchitected = "azure-waf";

    public const string CisAzureFoundations = "cis-azure-foundations";

    public const string AwsWellArchitected = "aws-waf";

    public const string CisAwsFoundations = "cis-aws-foundations";

    public const string AwsIamBaseline = "aws-iam-baseline";

    public const string AwsLandingZone = "aws-landing-zone";

    public const string GcpArchitectureFramework = "gcp-architecture-framework";

    public const string CisGcpFoundations = "cis-gcp-foundations";

    public const string GcpIamBaseline = "gcp-iam-baseline";

    public const string GcpLandingZone = "gcp-landing-zone";

    private static readonly HashSet<string> FocusedPilotBaselineSlugs = new(StringComparer.OrdinalIgnoreCase)
    {
        SecurityArchitectureBaseline,
        ReliabilityAndResilience,
        CostOptimization,
        PerformanceAndScalability,
        OperationalExcellence,
        SustainabilityAndResourceEfficiency,
    };

    private static readonly HashSet<string> AzureOverlaySlugs = new(StringComparer.OrdinalIgnoreCase)
    {
        AzureWellArchitected,
        CisAzureFoundations,
    };

    private static readonly HashSet<string> AwsOverlaySlugs = new(StringComparer.OrdinalIgnoreCase)
    {
        AwsWellArchitected,
        CisAwsFoundations,
        AwsIamBaseline,
        AwsLandingZone,
    };

    private static readonly HashSet<string> GcpOverlaySlugs = new(StringComparer.OrdinalIgnoreCase)
    {
        GcpArchitectureFramework,
        CisGcpFoundations,
        GcpIamBaseline,
        GcpLandingZone,
    };

    /// <summary>Normalizes a slug or filename stem for stable comparisons.</summary>
    public static string? Normalize(string? slugOrFileStem)
    {
        if (string.IsNullOrWhiteSpace(slugOrFileStem))
            return null;

        return slugOrFileStem.Trim().ToLowerInvariant();
    }

    /// <summary>Derives a slug from a bundled content filename such as <c>cost-optimization.json</c>.</summary>
    public static string FromBundledContentFileName(string fileName)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(fileName);

        string trimmed = fileName.Trim();

        if (trimmed.EndsWith(".json", StringComparison.OrdinalIgnoreCase))
            trimmed = trimmed[..^5];

        return Normalize(trimmed)
            ?? throw new InvalidOperationException($"Unable to derive pack slug from '{fileName}'.");
    }

    public static bool IsFocusedPilotBaselineSlug(string? slug) =>
        slug is not null && FocusedPilotBaselineSlugs.Contains(slug);

    public static bool IsOverlaySlug(string? slug, Contracts.Common.CloudProvider cloudProvider)
    {
        if (slug is null)
            return false;

        return cloudProvider switch
        {
            Contracts.Common.CloudProvider.Azure => AzureOverlaySlugs.Contains(slug),
            Contracts.Common.CloudProvider.Aws => AwsOverlaySlugs.Contains(slug),
            Contracts.Common.CloudProvider.Gcp => GcpOverlaySlugs.Contains(slug),
            Contracts.Common.CloudProvider.None => false,
            _ => throw new ArgumentOutOfRangeException(nameof(cloudProvider), cloudProvider, "Unsupported cloud provider."),
        };
    }
}
