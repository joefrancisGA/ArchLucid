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

    private static QuickScanService CreateService(IAgentCompletionClient completionClient) =>
        new(
            completionClient,
            new TestOptionsMonitor(new QuickScanOptions()),
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
