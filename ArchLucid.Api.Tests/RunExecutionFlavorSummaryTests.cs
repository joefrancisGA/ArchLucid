using ArchLucid.Api.Support;
using ArchLucid.Contracts.Metadata;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
public sealed class RunExecutionFlavorSummaryTests
{
    [Fact]
    public void Build_does_not_assume_simulator_when_host_mode_missing()
    {
        string summary = RunExecutionFlavorSummary.Build(new ArchitectureRun(), hostAgentExecutionMode: null);

        summary.Should().Contain("Agent execution mode was not stored");
        summary.Should().NotContain("deterministic analysis path on this host");
    }
}
