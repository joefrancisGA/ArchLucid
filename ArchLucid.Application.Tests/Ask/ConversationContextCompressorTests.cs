using ArchLucid.Application.Ask;
using ArchLucid.Core.Conversation;
using ArchLucid.Core.Llm;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.Ask;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ConversationContextCompressorTests
{
    [Fact]
    public async Task CompressAsync_keeps_recent_turns_verbatim_and_summarizes_older()
    {
        List<ConversationMessage> history =
        [
            new() { Role = ConversationMessageRole.User, Content = "turn-1" },
            new() { Role = ConversationMessageRole.Assistant, Content = "reply-1" },
            new() { Role = ConversationMessageRole.User, Content = "turn-2" },
            new() { Role = ConversationMessageRole.Assistant, Content = "reply-2" },
            new() { Role = ConversationMessageRole.User, Content = "turn-3" },
            new() { Role = ConversationMessageRole.Assistant, Content = "reply-3" }
        ];

        Mock<IAgentCompletionClient> llm = new();
        llm.Setup(c => c.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("Prior context summary.");

        ConversationContextCompressor sut = new(llm.Object, NullLogger<ConversationContextCompressor>.Instance);

        CompressedConversationContext result = await sut.CompressAsync(history, maxTurnsToKeepVerbatim: 2, CancellationToken.None);

        result.CompressedSummary.Should().Be("Prior context summary.");
        result.RecentVerbatim.Should().HaveCount(2);
        result.RecentVerbatim[^1].Content.Should().Be("reply-3");
        llm.Verify(
            c => c.CompleteJsonAsync(
                It.IsAny<string>(),
                It.Is<string>(p => p.Contains("turn-1") && p.Contains("reply-2") && !p.Contains("turn-3")),
                It.IsAny<int?>(),
                It.IsAny<float?>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task CompressAsync_fail_open_returns_full_history_when_llm_fails()
    {
        List<ConversationMessage> history =
        [
            new() { Role = ConversationMessageRole.User, Content = "one" },
            new() { Role = ConversationMessageRole.Assistant, Content = "two" },
            new() { Role = ConversationMessageRole.User, Content = "three" }
        ];

        Mock<IAgentCompletionClient> llm = new();
        llm.Setup(c => c.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("model down"));

        ConversationContextCompressor sut = new(llm.Object, NullLogger<ConversationContextCompressor>.Instance);

        CompressedConversationContext result = await sut.CompressAsync(history, maxTurnsToKeepVerbatim: 1, CancellationToken.None);

        result.CompressedSummary.Should().BeEmpty();
        result.RecentVerbatim.Should().BeEquivalentTo(history);
    }
}
