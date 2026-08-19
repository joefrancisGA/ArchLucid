using System.Text.Json;

using FluentAssertions;

namespace ArchLucid.ReviewApiHarness.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureRunStatusReaderTests
{
    [Theory]
    [InlineData("ReadyForCommit", true)]
    [InlineData("Committed", true)]
    [InlineData("4", true)]
    [InlineData("5", true)]
    [InlineData("Failed", false)]
    [InlineData("6", false)]
    public void IsReadyForCommitOrCommitted_maps_contracts_values(string status, bool expected)
    {
        ArchitectureRunStatusReader.IsReadyForCommitOrCommitted(status).Should().Be(expected);
    }

    [Theory]
    [InlineData("Failed", true)]
    [InlineData("FailedPartial", true)]
    [InlineData("6", true)]
    [InlineData("Committed", false)]
    public void IsTerminalFailure_maps_failure_statuses(string status, bool expected)
    {
        ArchitectureRunStatusReader.IsTerminalFailure(status).Should().Be(expected);
    }

    [Fact]
    public void ReadStatus_falls_back_to_legacyRunStatus_on_run_record_payloads()
    {
        using JsonDocument doc = JsonDocument.Parse(
            """{"run":{"runId":"aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee","legacyRunStatus":"ReadyForCommit"}}""");

        ArchitectureRunStatusReader.ReadStatus(doc.RootElement).Should().Be("ReadyForCommit");
    }
}
