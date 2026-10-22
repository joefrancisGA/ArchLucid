using ArchLucid.Core.Configuration;

using FluentAssertions;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Core.Tests.Configuration;

[Trait("Category", "Unit")]
public sealed class SponsorRoiSavingsGaugeOptionsConfigurationTests
{
    [Fact]
    public void SponsorRoiSavingsGaugeOptions_defaults_match_V1_cardinality_posture()
    {
        SponsorRoiSavingsGaugeOptions sut = new();

        sut.Enabled.Should().BeTrue();
        sut.RefreshIntervalMinutes.Should().Be(15);
        sut.RecordPerTenantSavings.Should().BeFalse();
    }

    [Fact]
    public void SponsorRoiSavingsGaugeOptions_section_binds_record_per_tenant_flag()
    {
        Dictionary<string, string?> values = new(StringComparer.OrdinalIgnoreCase)
        {
            [$"{SponsorRoiSavingsGaugeOptions.SectionPath}:Enabled"] = "true",
            [$"{SponsorRoiSavingsGaugeOptions.SectionPath}:RefreshIntervalMinutes"] = "30",
            [$"{SponsorRoiSavingsGaugeOptions.SectionPath}:RecordPerTenantSavings"] = "true",
        };

        IConfigurationRoot cfg = new ConfigurationBuilder().AddInMemoryCollection(values!).Build();
        SponsorRoiSavingsGaugeOptions? bound =
            cfg.GetSection(SponsorRoiSavingsGaugeOptions.SectionPath).Get<SponsorRoiSavingsGaugeOptions>();

        bound.Should().NotBeNull();
        bound!.Enabled.Should().BeTrue();
        bound.RefreshIntervalMinutes.Should().Be(30);
        bound.RecordPerTenantSavings.Should().BeTrue();
    }
}
