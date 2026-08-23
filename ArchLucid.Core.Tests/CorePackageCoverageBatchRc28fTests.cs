using System.Net;

using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Costing;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Security;

using FluentAssertions;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Core.Tests;

/// <summary>
///     RC28f package-coverage batch: network guard IP checks, identity normalization, costing catalog, and config presence.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CorePackageCoverageBatchRc28fTests
{
    [Theory]
    [InlineData("10.0.0.1")]
    [InlineData("172.16.8.1")]
    [InlineData("192.168.0.42")]
    [InlineData("169.254.12.34")]
    public void PrivateNetworkAddressGuard_IsForbiddenIpAddress_blocks_private_ipv4_literals(string address)
    {
        IPAddress ip = IPAddress.Parse(address);

        PrivateNetworkAddressGuard.IsForbiddenIpAddress(ip).Should().BeTrue();
    }

    [Fact]
    public void PrivateNetworkAddressGuard_IsForbiddenIpAddress_blocks_ipv6_link_local()
    {
        IPAddress linkLocal = IPAddress.Parse("fe80::1");

        PrivateNetworkAddressGuard.IsForbiddenIpAddress(linkLocal).Should().BeTrue();
    }

    [Theory]
    [InlineData("8.8.8.8")]
    [InlineData("2001:4860:4860::8888")]
    public void PrivateNetworkAddressGuard_IsForbiddenIpAddress_allows_public_addresses(string address)
    {
        IPAddress ip = IPAddress.Parse(address);

        PrivateNetworkAddressGuard.IsForbiddenIpAddress(ip).Should().BeFalse();
    }

    [Theory]
    [InlineData("User@Example.COM", "user@example.com", "User@Example.COM")]
    [InlineData("  Admin@Contoso.com  ", "admin@contoso.com", "Admin@Contoso.com")]
    public void IdentityEmailNormalizer_TryNormalize_maps_valid_addresses(
        string input,
        string expectedNormalized,
        string expectedDisplay)
    {
        bool ok = IdentityEmailNormalizer.TryNormalize(input, out string normalized, out string display);

        ok.Should().BeTrue();
        normalized.Should().Be(expectedNormalized);
        display.Should().Be(expectedDisplay);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("not-an-email")]
    public void IdentityEmailNormalizer_TryNormalize_rejects_invalid_input(string? input)
    {
        bool ok = IdentityEmailNormalizer.TryNormalize(input, out string normalized, out string display);

        ok.Should().BeFalse();
        normalized.Should().BeEmpty();
        display.Should().BeEmpty();
    }

    [Theory]
    [InlineData(RuntimePlatform.Lambda, CloudProvider.Aws, true, false)]
    [InlineData(RuntimePlatform.Gke, CloudProvider.Gcp, false, true)]
    [InlineData(RuntimePlatform.AppService, CloudProvider.Azure, false, false)]
    public void RuntimePlatformCloudFamily_maps_platform_to_cloud_family(
        RuntimePlatform platform,
        CloudProvider expectedFamily,
        bool isAws,
        bool isGcp)
    {
        RuntimePlatformCloudFamily.ResolveCloudFamily(platform).Should().Be(expectedFamily);
        RuntimePlatformCloudFamily.IsAws(platform).Should().Be(isAws);
        RuntimePlatformCloudFamily.IsGcp(platform).Should().Be(isGcp);
    }

    [Theory]
    [InlineData(RuntimePlatform.Vm, true, "Virtual Machines")]
    [InlineData(RuntimePlatform.AzureOpenAi, true, "Cognitive Services")]
    [InlineData(RuntimePlatform.Ec2, false, "")]
    public void InfrastructureCostPricingCatalog_TryGetRetailServiceName(
        RuntimePlatform platform,
        bool expectedFound,
        string expectedName)
    {
        bool found = InfrastructureCostPricingCatalog.TryGetRetailServiceName(platform, out string retailServiceName);

        found.Should().Be(expectedFound);
        retailServiceName.Should().Be(expectedName);
    }

    [Fact]
    public void ConfigurationKeyPresence_IsValuePresent_honors_null_blank_and_whitespace()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Present:Key"] = "value",
                ["Blank:Key"] = "",
                ["Whitespace:Key"] = "   ",
            })
            .Build();

        ConfigurationKeyPresence.IsValuePresent(configuration, "Present:Key").Should().BeTrue();
        ConfigurationKeyPresence.IsValuePresent(configuration, "Missing:Key").Should().BeFalse();
        ConfigurationKeyPresence.IsValuePresent(configuration, "Blank:Key").Should().BeFalse();
        ConfigurationKeyPresence.IsValuePresent(configuration, "Whitespace:Key").Should().BeFalse();
        ConfigurationKeyPresence.IsValuePresent(configuration, "  ").Should().BeFalse();
    }

    [Fact]
    public void ConfigurationKeyPresence_IsValuePresent_throws_when_configuration_null()
    {
        FluentActions
            .Invoking(() => ConfigurationKeyPresence.IsValuePresent(null!, "Any"))
            .Should()
            .Throw<ArgumentNullException>();
    }

    [Theory]
    [InlineData("waf-az-004", true)]
    [InlineData("waf-aws-004", true)]
    [InlineData("cis-gcp-001", true)]
    [InlineData("SEC-BASE-42", true)]
    [InlineData("finops-overrun", true)]
    [InlineData("custom-rule-1", false)]
    [InlineData(null, false)]
    public void StandardBaselinePolicyRuleIdPrefixes_IsStandardBaseline(string? policyRuleId, bool expected)
    {
        StandardBaselinePolicyRuleIdPrefixes.IsStandardBaseline(policyRuleId).Should().Be(expected);
    }
}
