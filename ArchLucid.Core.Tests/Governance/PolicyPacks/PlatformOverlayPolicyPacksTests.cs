using ArchLucid.Contracts.Common;

using ArchLucid.Core.Governance.PolicyPacks;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Governance.PolicyPacks;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class PlatformOverlayPolicyPacksTests
{
    [Theory]
    [InlineData(CloudProvider.Azure, "azure well-architected framework")]
    [InlineData(CloudProvider.Aws, "aws well-architected framework")]
    [InlineData(CloudProvider.Gcp, "google cloud architecture framework")]
    public void IsOverlayDisplayName_matches_case_insensitive_overlay_display_names(
        CloudProvider cloudProvider,
        string displayName)
    {
        PlatformOverlayPolicyPacks.IsOverlayDisplayName(displayName, cloudProvider).Should().BeTrue();
    }

    [Fact]
    public void IsOverlayDisplayName_rejects_fullwidth_latin_homoglyph_overlay_name()
    {
        const string fullwidthAzureWaf = "\uFF21zure Well-Architected Framework";

        PlatformOverlayPolicyPacks
            .IsOverlayDisplayName(fullwidthAzureWaf, CloudProvider.Azure)
            .Should()
            .BeFalse("catalog overlay names are canonical Latin; homoglyph typos are not auto-normalized");
    }
}
