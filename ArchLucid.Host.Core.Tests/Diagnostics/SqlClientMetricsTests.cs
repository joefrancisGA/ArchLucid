using ArchLucid.Host.Core.Diagnostics;

using FluentAssertions;

namespace ArchLucid.Host.Core.Tests.Diagnostics;

[Trait("Category", "Unit")]
public sealed class SqlClientMetricsTests
{
    [Fact]
    public void Update_and_read_round_trip_active_idle_and_wait_counters()
    {
        SqlClientMetrics.UpdateActiveConnections(12);
        SqlClientMetrics.UpdateIdleConnections(88);
        SqlClientMetrics.UpdatePoolWaitTimeMs(42);

        SqlClientMetrics.GetActiveConnections().Should().Be(12);
        SqlClientMetrics.GetIdleConnections().Should().Be(88);
        SqlClientMetrics.GetPoolWaitTimeMs().Should().Be(42);
    }

    [Fact]
    public void Update_clamps_negative_values_to_zero()
    {
        SqlClientMetrics.UpdateActiveConnections(-5);
        SqlClientMetrics.UpdateIdleConnections(-1);
        SqlClientMetrics.UpdatePoolWaitTimeMs(-10);

        SqlClientMetrics.GetActiveConnections().Should().Be(0);
        SqlClientMetrics.GetIdleConnections().Should().Be(0);
        SqlClientMetrics.GetPoolWaitTimeMs().Should().Be(0);
    }
}
