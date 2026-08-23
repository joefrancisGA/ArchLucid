using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance.Coverage;
using ArchLucid.Core.Governance.PolicyPacks;

namespace ArchLucid.Application.Governance.DefaultPolicyPacks;

/// <summary>Display metadata for first-party default policy packs seeded at tenant provisioning.</summary>
public static class DefaultPolicyPackCatalog
{
    /// <summary>Matches <c>pack.displayName</c> in <see cref="DefaultPolicyPackTemplates.AiGovernanceResponsibleAiV1Json" />.</summary>
    public const string AiGovernanceDisplayName = "AI Governance / Responsible AI";

    /// <summary>Matches <c>pack.description</c> for the AI governance template.</summary>
    public const string AiGovernanceDescription =
        "Starter baseline for AI/ML asset governance — model inventory, data handling, human oversight, and risk classification. Maps to NIST AI RMF v1.0 themes and EU AI Act high-risk categories. Not a compliance certification.";

    /// <summary>Matches <c>pack.displayName</c> in <see cref="DefaultPolicyPackTemplates.SecurityArchitectureBaselineV1Json" />.</summary>
    public const string SecurityBaselineDisplayName = "Security Architecture Baseline";

    /// <summary>Matches <c>pack.description</c> for the security baseline template.</summary>
    public const string SecurityBaselineDescription =
        "Starter security posture checks for cloud architecture reviews — identity, network, encryption, logging, and secure SDLC. Aligned to CIS Azure Foundations and OWASP ASVS themes. Not an exhaustive compliance assessment.";

    /// <summary>Matches <c>pack.displayName</c> in <see cref="DefaultPolicyPackTemplates.AzureWellArchitectedFrameworkV1Json" />.</summary>
    public const string AzureWellArchitectedDisplayName = "Azure Well-Architected Framework";

    /// <summary>Matches <c>pack.description</c> for the Azure WAF template.</summary>
    public const string AzureWellArchitectedDescription =
        "Reviewer prompts mapped to Microsoft Azure Well-Architected Framework pillar themes. Grounded in Azure extractor inventory and golden manifest governance fields. Not an official Microsoft Well-Architected assessment.";

    /// <summary>Matches <c>pack.displayName</c> in <see cref="DefaultPolicyPackTemplates.AzureCafLandingZoneV1Json" />.</summary>
    public const string AzureCafLandingZoneDisplayName = "Azure Landing Zone / Cloud Adoption Framework";

    /// <summary>Matches <c>pack.displayName</c> for the Azure CAF / landing zone template.</summary>
    public const string AzureCafLandingZoneDescription =
        "Starter prompts for enterprise Azure landing zones — management hierarchy, hub-spoke networking, policy initiatives, platform identity, and centralized observability. Thematic CAF/LZ mapping only; not conformance certification.";

    /// <summary>Matches <c>pack.displayName</c> in bundled FinOps template.</summary>
    public const string FinOpsCostOptimizationDisplayName = "FinOps & Cloud Cost Optimization";

    /// <summary>Matches bundled provider-neutral reliability baseline.</summary>
    public const string ReliabilityAndResilienceDisplayName = "Reliability and Resilience";

    /// <summary>Matches bundled provider-neutral performance baseline.</summary>
    public const string PerformanceAndScalabilityDisplayName = "Performance and Scalability";

    /// <summary>Matches bundled provider-neutral operational excellence baseline.</summary>
    public const string OperationalExcellenceDisplayName = "Operational Excellence";

    /// <summary>Matches bundled provider-neutral environmental sustainability baseline.</summary>
    public const string SustainabilityAndResourceEfficiencyDisplayName = "Sustainability and Resource Efficiency";

    /// <summary>Matches <c>pack.displayName</c> in bundled CIS Azure Foundations template.</summary>
    public const string CisAzureFoundationsDisplayName = "CIS Microsoft Azure Foundations Benchmark";

    /// <summary>Matches <c>pack.displayName</c> in bundled Zero Trust template.</summary>
    public const string ZeroTrustArchitectureDisplayName = "Zero Trust Architecture";

    /// <summary>Matches bundled AWS Well-Architected Framework template.</summary>
    public const string AwsWellArchitectedDisplayName = "AWS Well-Architected Framework";

    /// <summary>Matches bundled Google Cloud Architecture Framework template.</summary>
    public const string GcpArchitectureFrameworkDisplayName = "Google Cloud Architecture Framework";

    /// <summary>Matches bundled CIS AWS Foundations template.</summary>
    public const string CisAwsFoundationsDisplayName = "CIS AWS Foundations Benchmark";

    /// <summary>Matches bundled CIS GCP Foundations template.</summary>
    public const string CisGcpFoundationsDisplayName = "CIS Google Cloud Platform Foundation Benchmark";

    /// <summary>Matches bundled AWS IAM baseline template.</summary>
    public const string AwsIamBaselineDisplayName = "AWS IAM / Identity Center Architecture Baseline";

    /// <summary>Matches bundled GCP IAM baseline template.</summary>
    public const string GcpIamBaselineDisplayName = "GCP Cloud IAM Architecture Baseline";

    /// <summary>Matches bundled AWS landing zone template.</summary>
    public const string AwsLandingZoneDisplayName = "AWS Landing Zone / Control Tower";

    /// <summary>Matches bundled GCP landing zone template.</summary>
    public const string GcpLandingZoneDisplayName = "GCP Landing Zone / Resource Hierarchy";

    /// <summary>Cloud-neutral packs enabled for every target cloud provider baseline.</summary>
    public static readonly IReadOnlySet<string> CloudNeutralStandardBaselineDisplayNames =
        new HashSet<string>(StringComparer.Ordinal)
        {
            SecurityBaselineDisplayName,
            ReliabilityAndResilienceDisplayName,
            FinOpsCostOptimizationDisplayName,
            PerformanceAndScalabilityDisplayName,
            OperationalExcellenceDisplayName,
            SustainabilityAndResourceEfficiencyDisplayName,
            AiGovernanceDisplayName,
            ZeroTrustArchitectureDisplayName,
        };

    /// <summary>
    ///     Provider-neutral architecture-quality baseline packs that own a single <see cref="QualityDimension" />.
    /// </summary>
    public static readonly IReadOnlyDictionary<string, QualityDimension> ProviderNeutralBaselineQualityDimensions =
        new Dictionary<string, QualityDimension>(StringComparer.Ordinal)
        {
            [SecurityBaselineDisplayName] = QualityDimension.Security,
            [ReliabilityAndResilienceDisplayName] = QualityDimension.ReliabilityAndResilience,
            [FinOpsCostOptimizationDisplayName] = QualityDimension.CostEffectiveness,
            [PerformanceAndScalabilityDisplayName] = QualityDimension.PerformanceAndScalability,
            [OperationalExcellenceDisplayName] = QualityDimension.OperationalExcellence,
            [SustainabilityAndResourceEfficiencyDisplayName] = QualityDimension.SustainabilityAndResourceEfficiency,
        };

    /// <summary>Resolves the baseline <see cref="QualityDimension" /> for a bundled pack display name, if any.</summary>
    public static QualityDimension? TryResolveBaselineQualityDimension(string displayName)
    {
        if (string.IsNullOrWhiteSpace(displayName))
            return null;

        if (ProviderNeutralBaselineQualityDimensions.TryGetValue(displayName.Trim(), out QualityDimension dimension))
            return dimension;

        return null;
    }

    /// <summary>Azure-specific packs enabled when the run or tenant baseline targets Azure.</summary>
    public static readonly IReadOnlySet<string> AzureCloudSpecificStandardBaselineDisplayNames =
        new HashSet<string>(StringComparer.Ordinal)
        {
            AzureWellArchitectedDisplayName,
            CisAzureFoundationsDisplayName,
        };

    /// <summary>AWS-specific packs enabled when the run targets AWS.</summary>
    public static readonly IReadOnlySet<string> AwsCloudSpecificStandardBaselineDisplayNames =
        new HashSet<string>(StringComparer.Ordinal)
        {
            AwsWellArchitectedDisplayName,
            CisAwsFoundationsDisplayName,
            AwsIamBaselineDisplayName,
            AwsLandingZoneDisplayName,
        };

    /// <summary>GCP-specific packs enabled when the run targets GCP.</summary>
    public static readonly IReadOnlySet<string> GcpCloudSpecificStandardBaselineDisplayNames =
        new HashSet<string>(StringComparer.Ordinal)
        {
            GcpArchitectureFrameworkDisplayName,
            CisGcpFoundationsDisplayName,
            GcpIamBaselineDisplayName,
            GcpLandingZoneDisplayName,
        };

    /// <summary>Platform default packs enabled on tenant provisioning (Azure baseline) before operator opt-in.</summary>
    public static readonly IReadOnlySet<string> StandardBaselineDisplayNames =
        ResolveStandardBaselineDisplayNames(CloudProvider.Azure);

    /// <summary>Resolves the standard baseline display names for a target cloud provider.</summary>
    public static IReadOnlySet<string> ResolveStandardBaselineDisplayNames(CloudProvider cloudProvider)
    {
        HashSet<string> names = new(CloudNeutralStandardBaselineDisplayNames, StringComparer.Ordinal);

        switch (cloudProvider)
        {
            case CloudProvider.Azure:
                names.UnionWith(AzureCloudSpecificStandardBaselineDisplayNames);
                break;
            case CloudProvider.Aws:
                names.UnionWith(AwsCloudSpecificStandardBaselineDisplayNames);
                break;
            case CloudProvider.Gcp:
                names.UnionWith(GcpCloudSpecificStandardBaselineDisplayNames);
                break;
            default:
                throw new ArgumentOutOfRangeException(nameof(cloudProvider), cloudProvider, "Unsupported cloud provider.");
        }

        return names;
    }

    /// <summary>Returns whether a bundled platform pack is part of the Azure V1 standard baseline set.</summary>
    public static bool IsStandardBaselineDisplayName(string displayName) =>
        IsStandardBaselineDisplayName(displayName, CloudProvider.Azure);

    /// <summary>Returns whether a bundled platform pack is part of the standard baseline for a cloud provider.</summary>
    public static bool IsStandardBaselineDisplayName(string displayName, CloudProvider cloudProvider) =>
        ResolveStandardBaselineDisplayNames(cloudProvider).Contains(displayName);

    /// <summary>
    ///     Provider-branded overlays (WAF, CIS, landing zone) for a target cloud — not the six neutral baseline dimensions
    ///     or cloud-neutral standard packs such as AI governance.
    /// </summary>
    public static bool IsPlatformOverlayDisplayName(string displayName, CloudProvider cloudProvider) =>
        PlatformOverlayPolicyPacks.IsOverlayDisplayName(displayName, cloudProvider);
}
