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
        MeasurementHasScopeTag(measurements[0], ExecutiveRoiSavingsGaugeTelemetry.PlatformScope).Should().BeTrue();
    }

    private static bool MeasurementHasScopeTag(Measurement<double> measurement, string scope) =>
        MeasurementHasTagValue(measurement, "scope", scope);

    private static bool MeasurementHasTagValue(Measurement<double> measurement, string key, string expectedValue)
    {
        foreach (KeyValuePair<string, object?> tag in measurement.Tags)
        {
            if (tag.Key == key && (string?)tag.Value == expectedValue)
                return true;
        }

        return false;
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
        measurements.Should().Contain(m => MeasurementHasScopeTag(m, ExecutiveRoiSavingsGaugeTelemetry.PlatformScope));
        measurements.Should().Contain(m =>
            m.Value == 9000d
            && MeasurementHasScopeTag(m, ExecutiveRoiSavingsGaugeTelemetry.TenantScope)
            && MeasurementHasTagValue(m, "tenant_id", tenantId.ToString("D")));
    }

    [Fact]
    public void ToPrometheusDouble_clamps_negative_values_to_zero()
    {
        ExecutiveRoiSavingsGaugeTelemetry.ToPrometheusDouble(-10m).Should().Be(0d);
    }
}
