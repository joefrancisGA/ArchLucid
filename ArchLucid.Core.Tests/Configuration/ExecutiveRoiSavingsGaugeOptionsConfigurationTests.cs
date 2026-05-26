using ArchLucid.Core.Configuration;

using FluentAssertions;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Core.Tests.Configuration;

[Trait("Category", "Unit")]
public sealed class ExecutiveRoiSavingsGaugeOptionsConfigurationTests
{
    [Fact]
    public void ExecutiveRoiSavingsGaugeOptions_defaults_match_V1_cardinality_posture()
    {
        ExecutiveRoiSavingsGaugeOptions sut = new();

        sut.Enabled.Should().BeTrue();
        sut.RefreshIntervalMinutes.Should().Be(15);
        sut.RecordPerTenantSavings.Should().BeFalse();
    }

    [Fact]
    public void ExecutiveRoiSavingsGaugeOptions_section_binds_record_per_tenant_flag()
    {
        Dictionary<string, string?> values = new(StringComparer.OrdinalIgnoreCase)
        {
            [$"{ExecutiveRoiSavingsGaugeOptions.SectionPath}:Enabled"] = "true",
            [$"{ExecutiveRoiSavingsGaugeOptions.SectionPath}:RefreshIntervalMinutes"] = "30",
            [$"{ExecutiveRoiSavingsGaugeOptions.SectionPath}:RecordPerTenantSavings"] = "true",
        };

        IConfigurationRoot cfg = new ConfigurationBuilder().AddInMemoryCollection(values!).Build();
        ExecutiveRoiSavingsGaugeOptions? bound =
            cfg.GetSection(ExecutiveRoiSavingsGaugeOptions.SectionPath).Get<ExecutiveRoiSavingsGaugeOptions>();

        bound.Should().NotBeNull();
        bound!.Enabled.Should().BeTrue();
        bound.RefreshIntervalMinutes.Should().Be(30);
        bound.RecordPerTenantSavings.Should().BeTrue();
    }
}
