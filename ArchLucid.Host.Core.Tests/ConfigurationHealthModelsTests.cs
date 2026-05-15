using ArchLucid.Host.Core.Diagnostics;

using FluentAssertions;

namespace ArchLucid.Host.Core.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ConfigurationHealthModelsTests
{
    [Fact]
    public void ConfigurationHealthReport_carries_checks()
    {
        ConfigurationHealthCheckResult row = new() { Name = "sql", Status = "ok", Detail = "reachable" };

        ConfigurationHealthReport report = new() { Checks = [row] };

        report.Checks.Should().HaveCount(1);
        report.Checks[0].Name.Should().Be("sql");
        report.Checks[0].Status.Should().Be("ok");
        report.Checks[0].Detail.Should().Be("reachable");
    }
}
