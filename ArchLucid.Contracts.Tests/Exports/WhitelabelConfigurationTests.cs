using ArchLucid.Contracts.Exports;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Exports;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class WhitelabelConfigurationTests
{
    [Fact]
    public void ResolveFooterAttribution_uses_default_template_when_footer_null()
    {
        WhitelabelConfiguration configuration = new()
        {
            FirmDisplayName = "Contoso Advisory",
            ClientEngagementTitle = "Board packet Q2"
        };

        configuration.ResolveFooterAttribution().Should().Be("Prepared by Contoso Advisory using ArchLucid");
    }

    [Fact]
    public void ResolveFooterAttribution_substitutes_placeholder_in_custom_footer()
    {
        WhitelabelConfiguration configuration = new()
        {
            FirmDisplayName = "Fabrikam",
            ClientEngagementTitle = "Engagement",
            FooterAttribution = "Delivered by {FirmDisplayName}."
        };

        configuration.ResolveFooterAttribution().Should().Be("Delivered by Fabrikam.");
    }

    [Fact]
    public void ValidateIfProvided_accepts_null_and_complete_configuration()
    {
        Action actNull = () => WhitelabelConfigurationValidator.ValidateIfProvided(null);

        actNull.Should().NotThrow();

        WhitelabelConfiguration configuration = new()
        {
            FirmDisplayName = "A",
            ClientEngagementTitle = "B"
        };

        Action actOk = () => WhitelabelConfigurationValidator.ValidateIfProvided(configuration);

        actOk.Should().NotThrow();
    }

    [Theory]
    [InlineData("", "title")]
    [InlineData("firm", "")]
    [InlineData("   ", "title")]
    public void ValidateIfProvided_throws_when_required_strings_missing(string firm, string engagement)
    {
        WhitelabelConfiguration configuration = new()
        {
            FirmDisplayName = firm,
            ClientEngagementTitle = engagement
        };

        Action act = () => WhitelabelConfigurationValidator.ValidateIfProvided(configuration);

        act.Should().Throw<ArgumentException>();
    }
}
