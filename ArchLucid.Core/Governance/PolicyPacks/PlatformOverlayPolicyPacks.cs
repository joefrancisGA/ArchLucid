using ArchLucid.Contracts.Common;

namespace ArchLucid.Core.Governance.PolicyPacks;

/// <summary>Provider-branded overlay pack display names (WAF, CIS, landing zone) per cloud target.</summary>
public static class PlatformOverlayPolicyPacks
{
    public static readonly IReadOnlySet<string> AzureOverlayDisplayNames =
        new HashSet<string>(StringComparer.Ordinal)
        {
            "Azure Well-Architected Framework",
            "CIS Microsoft Azure Foundations Benchmark",
        };

    public static readonly IReadOnlySet<string> AwsOverlayDisplayNames =
        new HashSet<string>(StringComparer.Ordinal)
        {
            "AWS Well-Architected Framework",
            "CIS AWS Foundations Benchmark",
            "AWS IAM / Identity Center Architecture Baseline",
            "AWS Landing Zone / Control Tower",
        };

    public static readonly IReadOnlySet<string> GcpOverlayDisplayNames =
        new HashSet<string>(StringComparer.Ordinal)
        {
            "Google Cloud Architecture Framework",
            "CIS Google Cloud Platform Foundation Benchmark",
            "GCP Cloud IAM Architecture Baseline",
            "GCP Landing Zone / Resource Hierarchy",
        };

    public static bool IsOverlayDisplayName(string? displayName, CloudProvider cloudProvider)
    {
        if (string.IsNullOrWhiteSpace(displayName))
            return false;

        string trimmed = displayName.Trim();

        switch (cloudProvider)
        {
            case CloudProvider.Azure:
                return AzureOverlayDisplayNames.Contains(trimmed);
            case CloudProvider.Aws:
                return AwsOverlayDisplayNames.Contains(trimmed);
            case CloudProvider.Gcp:
                return GcpOverlayDisplayNames.Contains(trimmed);
            case CloudProvider.None:
                return false;
            default:
                throw new ArgumentOutOfRangeException(nameof(cloudProvider), cloudProvider, "Unsupported cloud provider.");
        }
    }
}
