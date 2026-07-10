using ArchLucid.AgentRuntime.QuickScan;
using ArchLucid.Contracts.Architecture;

using FluentAssertions;

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

        QuickScanService sut = new(completionClient.Object);
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

        QuickScanService sut = new(completionClient.Object);

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

        QuickScanService sut = new(completionClient.Object);

        QuickScanResult result = await sut.ScanAsync(new Dictionary<string, string>(), CancellationToken.None);

        result.Summary.Should().Be("only summary");
        result.Findings.Should().BeEmpty();
    }
}
