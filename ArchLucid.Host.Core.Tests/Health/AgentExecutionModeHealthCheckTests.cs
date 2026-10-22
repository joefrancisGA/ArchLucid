using ArchLucid.Host.Core.Health;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace ArchLucid.Host.Core.Tests.Health;

[Trait("Category", "Unit")]
public sealed class AgentExecutionModeHealthCheckTests
{
    [Theory]
    [InlineData(null, "Simulator")]
    [InlineData("", "Simulator")]
    [InlineData("Simulator", "Simulator")]
    [InlineData("simulator", "Simulator")]
    [InlineData("Real", "Real")]
    [InlineData("real", "Real")]
    [InlineData("Unexpected", "Unexpected")]
    public async Task CheckHealthAsync_reports_normalized_mode_in_data(string? configuredMode, string expectedMode)
    {
        Dictionary<string, string?> values = [];

        if (configuredMode is not null)
            values["AgentExecution:Mode"] = configuredMode;

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(values).Build();
        AgentExecutionModeHealthCheck check = new(configuration);

        HealthCheckResult result =
            await check.CheckHealthAsync(new HealthCheckContext(), CancellationToken.None);

        result.Status.Should().Be(HealthStatus.Healthy);
        result.Data[AgentExecutionModeHealthCheck.ModeDataKey].Should().Be(expectedMode);
        result.Description.Should().Contain(expectedMode);
    }
}
