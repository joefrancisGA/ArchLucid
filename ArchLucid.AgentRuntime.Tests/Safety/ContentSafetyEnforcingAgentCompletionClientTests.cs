using ArchLucid.AgentRuntime;
using ArchLucid.AgentRuntime.Safety;
using ArchLucid.AgentRuntime.Tests.Support;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Safety;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.AgentRuntime.Tests.Safety;

[Trait("Category", "Unit")]
public sealed class ContentSafetyEnforcingAgentCompletionClientTests
{
    [Fact]
    public async Task StreamJsonAsync_when_output_blocked_yields_no_chunks_before_throw()
    {
        Mock<IContentSafetyGuard> guard = new();
        guard.Setup(g => g.CheckInputAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ContentSafetyResult(true, null, null, null));
        guard.Setup(g => g.CheckOutputAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ContentSafetyResult(false, "blocked output", "Hate", 6));

        FakeAgentCompletionClient inner = new((_, _) => "{\"blocked\":true}");
        ContentSafetyEnforcingAgentCompletionClient sut = CreateSut(inner, guard.Object);

        List<string> chunks = [];

        Func<Task> act = async () =>
        {
            await foreach (string chunk in sut.StreamJsonAsync("sys", "user", cancellationToken: CancellationToken.None))
                chunks.Add(chunk);
        };

        await act.Should().ThrowAsync<InvalidOperationException>();
        chunks.Should().BeEmpty("blocked completion output must not stream to callers");
    }

    [Fact]
    public async Task StreamJsonAsync_when_output_allowed_yields_buffered_chunks_after_scan()
    {
        Mock<IContentSafetyGuard> guard = new();
        guard.Setup(g => g.CheckInputAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ContentSafetyResult(true, null, null, null));
        guard.Setup(g => g.CheckOutputAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ContentSafetyResult(true, null, null, null));

        FakeAgentCompletionClient inner = new((_, _) => "{\"allowed\":true}");
        ContentSafetyEnforcingAgentCompletionClient sut = CreateSut(inner, guard.Object);

        List<string> chunks = [];

        await foreach (string chunk in sut.StreamJsonAsync("sys", "user", cancellationToken: CancellationToken.None))
            chunks.Add(chunk);

        chunks.Should().NotBeEmpty();
        string joined = string.Concat(chunks);
        joined.Should().Be("{\"allowed\":true}");
    }

    [Fact]
    public async Task CompleteJsonAsync_when_system_prompt_blocked_does_not_invoke_inner()
    {
        Mock<IContentSafetyGuard> guard = new();
        guard.Setup(g => g.CheckInputAsync("blocked-system", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ContentSafetyResult(false, "blocked system", "Hate", 6));

        Mock<IAgentCompletionClient> inner = new();
        ContentSafetyEnforcingAgentCompletionClient sut = CreateSut(inner.Object, guard.Object);

        Func<Task> act = async () =>
            await sut.CompleteJsonAsync("blocked-system", "user", cancellationToken: CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>();
        inner.Verify(
            c => c.CompleteJsonAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<int?>(),
                It.IsAny<float?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task CompleteJsonAsync_when_user_prompt_blocked_does_not_invoke_inner()
    {
        Mock<IContentSafetyGuard> guard = new();
        guard.Setup(g => g.CheckInputAsync("safe-system", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ContentSafetyResult(true, null, null, null));
        guard.Setup(g => g.CheckInputAsync("blocked-user", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ContentSafetyResult(false, "blocked user", "Violence", 6));

        Mock<IAgentCompletionClient> inner = new();
        ContentSafetyEnforcingAgentCompletionClient sut = CreateSut(inner.Object, guard.Object);

        Func<Task> act = async () =>
            await sut.CompleteJsonAsync("safe-system", "blocked-user", cancellationToken: CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>();
        inner.Verify(
            c => c.CompleteJsonAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<int?>(),
                It.IsAny<float?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private static ContentSafetyEnforcingAgentCompletionClient CreateSut(
        IAgentCompletionClient inner,
        IContentSafetyGuard guard)
    {
        ContentSafetyOptions options = new() { EvaluateCompletionPromptAndResponse = true };

        return new ContentSafetyEnforcingAgentCompletionClient(
            inner,
            guard,
            new FixedValueOptionsMonitor<ContentSafetyOptions>(options),
            NullLogger<ContentSafetyEnforcingAgentCompletionClient>.Instance);
    }
}
