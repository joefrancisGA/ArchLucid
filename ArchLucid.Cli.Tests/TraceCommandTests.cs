using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

/// <summary>Unit tests for <see cref="TraceCommand" /> output and URL building (no live API).</summary>

[Trait("Category", "Unit")]
public sealed class TraceCommandTests
{
    [Fact]
    public async Task RunCoreAsync_WhenOtelTraceIdAndTemplateSet_WritesEncodedTraceViewerUrl()
    {
        StringWriter output = new();
        const string runId = "a1b2c3d4e5f6789012345678901234ab";
        const string traceId = "trace+id/with special";
        const string template = "https://grafana.example.com/explore?traceId={traceId}&other={traceId}";

        int exitCode = await TraceCommand.RunCoreAsync(
            runId,
            _ => Task.FromResult<ArchLucidApiClient.GetRunResult?>(
                new ArchLucidApiClient.GetRunResult
                {
                    Run = new ArchLucidApiClient.RunInfo { RunId = runId, OtelTraceId = traceId }
                }),
            () => template,
            () => false,
            output,
            null);

        exitCode.Should().Be(0);
        string expected = TraceCommand.BuildTraceViewerUrl(template, traceId);
        output.ToString().TrimEnd().Should().Be(expected);
    }

    [Fact]
    public async Task RunCoreAsync_WhenOtelTraceIdMissing_WritesNoTraceMessage()
    {
        StringWriter output = new();
        const string runId = "run-xyz";

        int exitCode = await TraceCommand.RunCoreAsync(
            runId,
            _ => Task.FromResult<ArchLucidApiClient.GetRunResult?>(
                new ArchLucidApiClient.GetRunResult
                {
                    Run = new ArchLucidApiClient.RunInfo { RunId = runId, OtelTraceId = null }
                }),
            () => "https://x/{traceId}",
            () => false,
            output,
            null);

        exitCode.Should().Be(0);
        string text = output.ToString();
        text.Should().Contain($"No trace ID recorded for run {runId}");
        text.Should().Contain("predate trace persistence");
    }

    [Fact]
    public async Task RunCoreAsync_WhenTemplateUnset_WritesRawTraceIdAndInstructions()
    {
        StringWriter output = new();
        const string runId = "run-1";
        const string traceId = "deadbeefdeadbeefdeadbeefdeadbeef";

        int exitCode = await TraceCommand.RunCoreAsync(
            runId,
            _ => Task.FromResult<ArchLucidApiClient.GetRunResult?>(
                new ArchLucidApiClient.GetRunResult
                {
                    Run = new ArchLucidApiClient.RunInfo { RunId = runId, OtelTraceId = traceId }
                }),
            () => null,
            () => false,
            output,
            null);

        exitCode.Should().Be(0);
        string text = output.ToString();
        text.Should().Contain(traceId);
        text.Should().Contain("ARCHLUCID_TRACE_VIEWER_URL_TEMPLATE");
        text.Should().Contain("https://grafana.example.com/explore?traceId={traceId}");
    }

    [Fact]
    public async Task RunCoreAsync_WhenRunNotFound_ReturnsOperationFailed()
    {
        StringWriter output = new();
        const string runId = "missing-run";

        int exitCode = await TraceCommand.RunCoreAsync(
            runId,
            _ => Task.FromResult<ArchLucidApiClient.GetRunResult?>(null),
            () => "https://x/{traceId}",
            () => false,
            output,
            null);

        exitCode.Should().Be(CliExitCode.OperationFailed);
        output.ToString().Should().Contain($"Run '{runId}' not found");
    }

    [Fact]
    public async Task RunCoreAsync_WhenShouldOpenBrowser_InvokesDelegateWithBuiltUrl()
    {
        StringWriter output = new();
        const string runId = "run-open";
        const string traceId = "trace-id-123";
        const string template = "https://viewer/{traceId}";
        string? openedUrl = null;

        int exitCode = await TraceCommand.RunCoreAsync(
            runId,
            _ => Task.FromResult<ArchLucidApiClient.GetRunResult?>(
                new ArchLucidApiClient.GetRunResult
                {
                    Run = new ArchLucidApiClient.RunInfo { RunId = runId, OtelTraceId = traceId }
                }),
            () => template,
            () => true,
            output,
            url => openedUrl = url);

        exitCode.Should().Be(CliExitCode.Success);
        openedUrl.Should().Be(TraceCommand.BuildTraceViewerUrl(template, traceId));
    }

    [Fact]
    public async Task RunCoreAsync_WhenShouldOpenBrowserButDelegateNull_DoesNotThrow()
    {
        StringWriter output = new();

        Func<Task<int>> act = async () => await TraceCommand.RunCoreAsync(
            "run-1",
            _ => Task.FromResult<ArchLucidApiClient.GetRunResult?>(
                new ArchLucidApiClient.GetRunResult
                {
                    Run = new ArchLucidApiClient.RunInfo { RunId = "run-1", OtelTraceId = "trace" }
                }),
            () => "https://x/{traceId}",
            () => true,
            output,
            openBrowser: null);

        await act.Should().NotThrowAsync();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void BuildTraceViewerUrl_throws_when_template_missing(string? template)
    {
        Action act = () => TraceCommand.BuildTraceViewerUrl(template!, "trace");

        act.Should().Throw<ArgumentException>();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void BuildTraceViewerUrl_throws_when_traceId_missing(string? traceId)
    {
        Action act = () => TraceCommand.BuildTraceViewerUrl("https://x/{traceId}", traceId!);

        act.Should().Throw<ArgumentException>();
    }

    [Theory]
    [InlineData(null, false)]
    [InlineData("", false)]
    [InlineData("   ", false)]
    [InlineData("0", false)]
    [InlineData("1", true)]
    [InlineData("TRUE", true)]
    [InlineData("true", true)]
    public void ReadOpenBrowserEnv_parses_truthy_values(string? value, bool expected)
    {
        string? previous = Environment.GetEnvironmentVariable("ARCHLUCID_TRACE_OPEN_BROWSER");

        try
        {
            Environment.SetEnvironmentVariable("ARCHLUCID_TRACE_OPEN_BROWSER", value);

            TraceCommand.ReadOpenBrowserEnv().Should().Be(expected);
        }
        finally
        {
            Environment.SetEnvironmentVariable("ARCHLUCID_TRACE_OPEN_BROWSER", previous);
        }
    }
}
