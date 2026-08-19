using ArchLucid.AgentRuntime;
using ArchLucid.AgentRuntime.QuickScan;
using ArchLucid.AgentRuntime.Safety;

using FluentAssertions;

using Moq;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AgentRuntimePackageCoverageBatch3Tests
{
    [Fact]
    public void QuickScanLlmPrompts_exposes_routing_marker_in_system_prompt()
    {
        QuickScanLlmPrompts.ClientRoutingMarker.Should().Be("lightweight architecture scanner");
        QuickScanLlmPrompts.SystemPrompt.Should().Contain(QuickScanLlmPrompts.ClientRoutingMarker);
        QuickScanLlmPrompts.SystemPrompt.Should().Contain("findings");
    }

    [Fact]
    public async Task SchemaRemediationAgentCompletionClientAdapter_forwards_completion_calls()
    {
        Mock<IAgentCompletionClient> inner = new();
        inner.Setup(i => i.Descriptor).Returns(LlmProviderDescriptor.ForOffline("azure-openai", "gpt-4o"));
        inner.Setup(i => i.CompleteJsonAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<int?>(),
                It.IsAny<float?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync("""{"ok":true}""");

        SchemaRemediationAgentCompletionClientAdapter sut = new(inner.Object);

        sut.Descriptor.ModelId.Should().Be("gpt-4o");

        string json = await sut.CompleteJsonAsync("sys", "user", cancellationToken: CancellationToken.None);

        json.Should().Be("""{"ok":true}""");
        inner.Verify(
            i => i.CompleteJsonAsync("sys", "user", null, null, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task NullContentSafetyGuard_completes_without_redaction()
    {
        NullContentSafetyGuard sut = new();

        await sut.Invoking(s => s.CheckInputAsync("hello", CancellationToken.None)).Should().NotThrowAsync();
        await sut.Invoking(s => s.CheckOutputAsync("world", CancellationToken.None)).Should().NotThrowAsync();
    }

    [Fact]
    public void SchemaRemediationAgentCompletionClientAdapter_rejects_null_inner()
    {
        Action act = () => _ = new SchemaRemediationAgentCompletionClientAdapter(null!);

        act.Should().Throw<ArgumentNullException>();
    }
}
