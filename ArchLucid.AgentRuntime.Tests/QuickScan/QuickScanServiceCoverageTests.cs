using ArchLucid.AgentRuntime.QuickScan;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Configuration;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.AgentRuntime.Tests.QuickScan;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class QuickScanServiceCoverageTests
{
    [Fact]
    public async Task ScanAsync_parses_fake_completion_json_into_findings()
    {
        Mock<IAgentCompletionClient> completionClient = new();
        completionClient
            .Setup(client => client.CompleteJsonAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<int?>(),
                It.IsAny<float?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(FakeQuickScanCompletionJson.Build("""{"context":"azure vnet hub spoke"}"""));

        QuickScanService sut = CreateService(completionClient.Object);
        Dictionary<string, string> files = new() { ["context.txt"] = "azure vnet hub spoke" };

        QuickScanResult result = await sut.ScanAsync(files, CancellationToken.None);

        result.Summary.Should().Contain("Simulator quick-scan");
        result.Findings.Should().NotBeEmpty();
    }

    [Fact]
    public async Task ScanAsync_returns_no_response_message_when_completion_is_blank()
    {
        Mock<IAgentCompletionClient> completionClient = new();
        completionClient
            .Setup(client => client.CompleteJsonAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<int?>(),
                It.IsAny<float?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync("   ");

        QuickScanService sut = CreateService(completionClient.Object);

        QuickScanResult result = await sut.ScanAsync(new Dictionary<string, string>(), CancellationToken.None);

        result.Summary.Should().Be("No response from LLM.");
        result.Findings.Should().BeEmpty();
    }

    [Fact]
    public async Task ScanAsync_returns_empty_findings_when_json_has_no_findings_array()
    {
        Mock<IAgentCompletionClient> completionClient = new();
        completionClient
            .Setup(client => client.CompleteJsonAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<int?>(),
                It.IsAny<float?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync("""{"summary":"only summary"}""");

        QuickScanService sut = CreateService(completionClient.Object);

        QuickScanResult result = await sut.ScanAsync(new Dictionary<string, string>(), CancellationToken.None);

        result.Summary.Should().Be("only summary");
        result.Findings.Should().BeEmpty();
    }

    [Fact]
    public async Task ScanAsync_labels_missing_finding_fields_and_source_agent_as_not_stored()
    {
        Mock<IAgentCompletionClient> completionClient = new();
        completionClient
            .Setup(client => client.CompleteJsonAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<int?>(),
                It.IsAny<float?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync("""{"summary":"scan","findings":[{"message":""}]}""");

        QuickScanService sut = CreateService(completionClient.Object);

        QuickScanResult result = await sut.ScanAsync(new Dictionary<string, string>(), CancellationToken.None);

        result.Findings.Should().ContainSingle();
        result.Findings[0].Category.Should().Be("Category was not stored.");
        result.Findings[0].Message.Should().Be("Finding message was not stored.");
        result.Findings[0].SourceAgent.Should().Be(default);
        result.Findings[0].ReasoningTrace.Should().Be("Severity was not stored.");
    }

    [Fact]
    public async Task ScanAsync_propagates_caller_cancellation_without_retrying()
    {
        using CancellationTokenSource caller = new();
        int calls = 0;
        Mock<IAgentCompletionClient> completionClient = new();
        completionClient.Setup(client => client.CompleteJsonAsync(
                It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()))
            .Returns((string _, string _, int? _, float? _, CancellationToken ct) =>
            {
                Interlocked.Increment(ref calls);
                caller.Cancel();
                return Task.FromCanceled<string>(ct);
            });

        QuickScanService sut = CreateService(completionClient.Object,
            new QuickScanOptions { MaxModelCallsPerScan = 1, MaxRetryCount = 2 });

        Func<Task> invoke = () => sut.ScanAsync(new Dictionary<string, string>(), caller.Token);

        await invoke.Should().ThrowAsync<OperationCanceledException>();
        calls.Should().Be(1);
    }

    [Fact]
    public async Task ScanAsync_reuses_one_linked_deadline_token_across_retries()
    {
        int calls = 0;
        List<CancellationToken> tokens = [];
        Mock<IAgentCompletionClient> completionClient = new();
        completionClient.Setup(client => client.CompleteJsonAsync(
                It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()))
            .Returns((string _, string _, int? _, float? _, CancellationToken ct) =>
            {
                tokens.Add(ct);
                return Interlocked.Increment(ref calls) < 3
                    ? Task.FromException<string>(new HttpRequestException("transient"))
                    : Task.FromResult("""{"summary":"recovered"}""");
            });

        QuickScanService sut = CreateService(completionClient.Object,
            new QuickScanOptions { MaxModelCallsPerScan = 1, MaxRetryCount = 2 });

        QuickScanResult result = await sut.ScanAsync(new Dictionary<string, string>(), CancellationToken.None);

        result.Summary.Should().Be("recovered");
        calls.Should().Be(3);
        tokens.Distinct().Should().ContainSingle("all retries must share one processing deadline");
    }

    [Fact]
    public async Task ScanAsync_global_deadline_stops_retry_loop_after_first_timeout()
    {
        int calls = 0;
        Mock<IAgentCompletionClient> completionClient = new();
        completionClient.Setup(client => client.CompleteJsonAsync(
                It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()))
            .Returns(async (string _, string _, int? _, float? _, CancellationToken ct) =>
            {
                Interlocked.Increment(ref calls);
                await Task.Delay(Timeout.InfiniteTimeSpan, ct);
                return "{}";
            });

        QuickScanService sut = CreateService(completionClient.Object,
            new QuickScanOptions
            {
                MaxModelCallsPerScan = 1,
                MaxRetryCount = 2,
                MaxProcessingDurationSeconds = 5
            });

        QuickScanResult result = await sut.ScanAsync(new Dictionary<string, string>(), CancellationToken.None);

        result.Summary.Should().Be("Quick scan timed out before a result could be produced.");
        calls.Should().Be(1);
    }

    [Fact]
    public async Task ScanAsync_provider_initiated_cancellation_is_not_a_processing_timeout()
    {
        Mock<IAgentCompletionClient> completionClient = new();
        completionClient.Setup(client => client.CompleteJsonAsync(
                It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new OperationCanceledException("provider canceled"));

        QuickScanService sut = CreateService(completionClient.Object);
        QuickScanResult result = await sut.ScanAsync(new Dictionary<string, string>(), CancellationToken.None);

        result.Summary.Should().Be("Quick scan could not be completed.");
    }

    private static QuickScanService CreateService(
        IAgentCompletionClient completionClient,
        QuickScanOptions? options = null) =>
        new(
            completionClient,
            new TestOptionsMonitor(options ?? new QuickScanOptions()),
            new TestSafetyOptionsMonitor(new QuickScanSafetyOptions { Enabled = false }),
            TimeProvider.System);

    private sealed class TestOptionsMonitor(QuickScanOptions value) : IOptionsMonitor<QuickScanOptions>
    {
        public QuickScanOptions CurrentValue => value;

        public QuickScanOptions Get(string? name) => value;

        public IDisposable? OnChange(Action<QuickScanOptions, string?> listener) => null;
    }

    private sealed class TestSafetyOptionsMonitor(QuickScanSafetyOptions value) : IOptionsMonitor<QuickScanSafetyOptions>
    {
        public QuickScanSafetyOptions CurrentValue => value;

        public QuickScanSafetyOptions Get(string? name) => value;

        public IDisposable? OnChange(Action<QuickScanSafetyOptions, string?> listener) => null;
    }
}
