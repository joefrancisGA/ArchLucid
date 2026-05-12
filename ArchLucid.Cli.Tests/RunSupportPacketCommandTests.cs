using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

/// <summary><see cref="RunSupportPacketCommand.RunCoreAsync"/> wiring — mocked HTTP projections.</summary>
[Trait("Category", "Unit")]
public sealed class RunSupportPacketCommandTests
{
    [Fact]
    public async Task RunCoreAsync_when_run_missing_writes_failure_and_returns_operation_failed()
    {
        StringWriter output = new();
        const string runId = "missing-run";

        int code = await RunSupportPacketCommand.RunCoreAsync(
            runId,
            _ => Task.FromResult<ArchLucidApiClient.GetRunResult?>(null),
            _ => Task.FromResult<string?>(null),
            "http://localhost:5128",
            output);

        code.Should().Be(CliExitCode.OperationFailed);
        output.ToString().Should().Contain("not found");
    }

    [Fact]
    public async Task RunCoreAsync_when_present_writes_support_banner()
    {
        StringWriter output = new();
        const string runId = "rid-full";

        int code = await RunSupportPacketCommand.RunCoreAsync(
            runId,
            _ => Task.FromResult<ArchLucidApiClient.GetRunResult?>(
                new ArchLucidApiClient.GetRunResult
                {
                    Run = new ArchLucidApiClient.RunInfo { RunId = runId },
                    Results = []
                }),
            _ => Task.FromResult<string?>("{}"),
            "http://localhost:5128",
            output);

        code.Should().Be(CliExitCode.Success);
        output.ToString().Should().Contain("support packet");
    }
}
