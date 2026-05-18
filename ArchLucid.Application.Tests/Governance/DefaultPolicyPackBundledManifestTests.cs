using ArchLucid.Application.Governance.DefaultPolicyPacks;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class DefaultPolicyPackBundledManifestTests
{
    [Fact]
    public void LoadBundles_returns_twenty_three_ga_bundles_with_metadata()
    {
        IReadOnlyList<DefaultPolicyPackBundleDefinition> bundles = DefaultPolicyPackBundledManifest.LoadBundles();

        bundles.Should().HaveCount(23);
        bundles.Should().OnlyContain(b => !string.IsNullOrWhiteSpace(b.DisplayName));
        bundles.Should().OnlyContain(b => !string.IsNullOrWhiteSpace(b.Description));
        bundles.Should().OnlyContain(b => b.ContentJson.Contains("complianceRuleKeys", StringComparison.Ordinal));
        bundles.Select(b => b.DisplayName).Should().Contain(DefaultPolicyPackCatalog.AiGovernanceDisplayName);
        bundles.Select(b => b.DisplayName).Should().Contain("GDPR Compliance Baseline");
    }
}
