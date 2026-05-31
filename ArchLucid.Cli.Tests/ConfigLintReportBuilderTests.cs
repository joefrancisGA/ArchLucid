using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ConfigLintReportBuilderTests
{
    [Theory]
    [InlineData(0, 0, "READY")]
    [InlineData(0, 2, "WARN")]
    [InlineData(1, 0, "HOLD")]
    [InlineData(2, 3, "HOLD")]
    public void ResolveDisposition_MapsBlockingAndAdvisoryCounts(
        int blockingCount,
        int advisoryCount,
        string expected)
    {
        ConfigLintReportBuilder.ResolveDisposition(blockingCount, advisoryCount).Should().Be(expected);
    }
}
