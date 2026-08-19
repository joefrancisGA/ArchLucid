using ArchLucid.Host.Core.Configuration;

using FluentAssertions;

namespace ArchLucid.Host.Core.Tests.Configuration;

[Trait("Category", "Unit")]
public sealed class DataConsistencyOptionsCoverageTests
{
    [Fact]
    public void DataConsistencyEnforcementOptions_exposes_section_name_and_defaults()
    {
        DataConsistencyEnforcementOptions options = new();

        DataConsistencyEnforcementOptions.SectionName.Should().Be("DataConsistency:Enforcement");
        options.Mode.Should().Be(DataConsistencyEnforcementMode.Warn);
        options.MaxRowsPerBatch.Should().Be(500);
        options.AlertThreshold.Should().Be(1);
        options.AutoQuarantine.Should().BeFalse();
    }

    [Fact]
    public void DataConsistencyProbeOptions_exposes_section_name_and_defaults()
    {
        DataConsistencyProbeOptions options = new();

        DataConsistencyProbeOptions.SectionName.Should().Be("DataConsistency");
        options.OrphanProbeEnabled.Should().BeTrue();
        options.OrphanProbeIntervalMinutes.Should().Be(60);
        options.OrphanProbeRemediationDryRunLogMaxRows.Should().Be(0);
        options.EnableAutoRemediation.Should().BeFalse();
    }
}
