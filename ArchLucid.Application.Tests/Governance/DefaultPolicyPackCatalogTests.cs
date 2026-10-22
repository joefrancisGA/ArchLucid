using ArchLucid.Application.Governance.DefaultPolicyPacks;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class DefaultPolicyPackCatalogTests
{
    [Fact]
    public void ResolveStandardBaseline_aws_includes_aws_waf_and_cis()
    {
        IReadOnlySet<string> names = DefaultPolicyPackCatalog.ResolveStandardBaselineDisplayNames(CloudProvider.Aws);

        names.Should().Contain(DefaultPolicyPackCatalog.AwsWellArchitectedDisplayName);
        names.Should().Contain(DefaultPolicyPackCatalog.CisAwsFoundationsDisplayName);
        names.Should().Contain(DefaultPolicyPackCatalog.AwsIamBaselineDisplayName);
        names.Should().Contain(DefaultPolicyPackCatalog.AwsLandingZoneDisplayName);
        names.Should().NotContain(DefaultPolicyPackCatalog.AzureWellArchitectedDisplayName);
    }

    [Fact]
    public void ResolveStandardBaseline_gcp_includes_gcp_framework_and_cis()
    {
        IReadOnlySet<string> names = DefaultPolicyPackCatalog.ResolveStandardBaselineDisplayNames(CloudProvider.Gcp);

        names.Should().Contain(DefaultPolicyPackCatalog.GcpArchitectureFrameworkDisplayName);
        names.Should().Contain(DefaultPolicyPackCatalog.CisGcpFoundationsDisplayName);
        names.Should().Contain(DefaultPolicyPackCatalog.GcpIamBaselineDisplayName);
        names.Should().Contain(DefaultPolicyPackCatalog.GcpLandingZoneDisplayName);
        names.Should().NotContain(DefaultPolicyPackCatalog.AzureWellArchitectedDisplayName);
    }

    [Fact]
    public void ResolveStandardBaseline_azure_includes_azure_waf_and_cis()
    {
        IReadOnlySet<string> names = DefaultPolicyPackCatalog.ResolveStandardBaselineDisplayNames(CloudProvider.Azure);

        names.Should().Contain(DefaultPolicyPackCatalog.AzureWellArchitectedDisplayName);
        names.Should().Contain(DefaultPolicyPackCatalog.CisAzureFoundationsDisplayName);
        names.Should().NotContain(DefaultPolicyPackCatalog.AwsWellArchitectedDisplayName);
    }

    [Fact]
    public void ResolveStandardBaseline_always_includes_cloud_neutral_packs()
    {
        IReadOnlySet<string> aws = DefaultPolicyPackCatalog.ResolveStandardBaselineDisplayNames(CloudProvider.Aws);

        aws.Should().Contain(DefaultPolicyPackCatalog.SecurityBaselineDisplayName);
        aws.Should().Contain(DefaultPolicyPackCatalog.ReliabilityAndResilienceDisplayName);
        aws.Should().Contain(DefaultPolicyPackCatalog.FinOpsCostOptimizationDisplayName);
        aws.Should().Contain(DefaultPolicyPackCatalog.PerformanceAndScalabilityDisplayName);
        aws.Should().Contain(DefaultPolicyPackCatalog.OperationalExcellenceDisplayName);
        aws.Should().Contain(DefaultPolicyPackCatalog.SustainabilityAndResourceEfficiencyDisplayName);
        aws.Should().NotContain(DefaultPolicyPackCatalog.AzureWellArchitectedDisplayName);
    }

    [Fact]
    public void TryResolveBaselineQualityDimension_maps_six_provider_neutral_packs()
    {
        DefaultPolicyPackCatalog.TryResolveBaselineQualityDimension(DefaultPolicyPackCatalog.SecurityBaselineDisplayName)
            .Should()
            .Be(ArchLucid.Contracts.Governance.Coverage.QualityDimension.Security);
        DefaultPolicyPackCatalog
            .TryResolveBaselineQualityDimension(DefaultPolicyPackCatalog.SustainabilityAndResourceEfficiencyDisplayName)
            .Should()
            .Be(ArchLucid.Contracts.Governance.Coverage.QualityDimension.SustainabilityAndResourceEfficiency);
        DefaultPolicyPackCatalog.TryResolveBaselineQualityDimension(DefaultPolicyPackCatalog.AzureWellArchitectedDisplayName)
            .Should()
            .BeNull();
    }
}
