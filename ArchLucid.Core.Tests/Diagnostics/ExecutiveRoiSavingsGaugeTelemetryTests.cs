using System.Diagnostics.Metrics;
using ArchLucid.Core.Diagnostics;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Diagnostics;

[Trait("Category", "Unit")]
public sealed class ExecutiveRoiSavingsGaugeTelemetryTests
{
    [Fact]
    public void BuildMeasurements_platform_only_when_per_tenant_disabled()
    {
        Measurement<double>[] measurements = ExecutiveRoiSavingsGaugeTelemetry.BuildMeasurements(
            12500.75m,
            [(Guid.Parse("11111111-1111-1111-1111-111111111111"), 5000m)],
            recordPerTenant: false);

        measurements.Should().ContainSingle();
        measurements[0].Value.Should().BeApproximately(12500.75, 0.001);
        measurements[0].Tags.Should().Contain(t => t.Key == "scope" && (string?)t.Value == ExecutiveRoiSavingsGaugeTelemetry.PlatformScope);
    }

    [Fact]
    public void BuildMeasurements_includes_per_tenant_rows_when_enabled()
    {
        Guid tenantId = Guid.Parse("22222222-2222-2222-2222-222222222222");

        Measurement<double>[] measurements = ExecutiveRoiSavingsGaugeTelemetry.BuildMeasurements(
            9000m,
            [(tenantId, 9000m)],
            recordPerTenant: true);

        measurements.Should().HaveCount(2);
        measurements.Should().Contain(m =>
            m.Tags.Any(t => t.Key == "scope" && (string?)t.Value == ExecutiveRoiSavingsGaugeTelemetry.PlatformScope));
        measurements.Should().Contain(m =>
            m.Value == 9000d
            && m.Tags.Any(t => t.Key == "scope" && (string?)t.Value == ExecutiveRoiSavingsGaugeTelemetry.TenantScope)
            && m.Tags.Any(t => t.Key == "tenant_id" && (string?)t.Value == tenantId.ToString("D")));
    }

    [Fact]
    public void ToPrometheusDouble_clamps_negative_values_to_zero()
    {
        ExecutiveRoiSavingsGaugeTelemetry.ToPrometheusDouble(-10m).Should().Be(0d);
    }
}
