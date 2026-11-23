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
    public async Task StreamJsonAsync_canceled_during_output_safety_scan_does_not_replay_buffered_chunks()
    {
        using CancellationTokenSource caller = new();
        ContentSafetyResult allowed = new(true, null, null, null);
        Mock<IContentSafetyGuard> guard = new();
        guard.Setup(g => g.CheckInputAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(allowed);
        guard.Setup(g => g.CheckOutputAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns((string output, CancellationToken token) =>
            {
                // Simulate a safety provider which returns a successful decision after cancellation.
                caller.Cancel();
                return Task.FromResult(allowed);
            });

        FakeAgentCompletionClient inner = new((_, _) => new string('x', 120));
        ContentSafetyEnforcingAgentCompletionClient sut = CreateSut(inner, guard.Object);

        await using IAsyncEnumerator<string> enumerator = sut
            .StreamJsonAsync("sys", "user", cancellationToken: caller.Token)
            .GetAsyncEnumerator();

        await Assert.ThrowsAnyAsync<OperationCanceledException>(
            async () => { await enumerator.MoveNextAsync(); });
    }

    [Fact]
    public async Task CompleteJsonAsync_when_input_safety_scan_cancels_does_not_start_other_providers()
    {
        using CancellationTokenSource caller = new();
        ContentSafetyResult allowed = new(true, null, null, null);
        Mock<IContentSafetyGuard> guard = new();
        guard.Setup(g => g.CheckInputAsync("sys", It.IsAny<CancellationToken>()))
            .Returns((string value, CancellationToken token) =>
            {
                caller.Cancel();
                return Task.FromResult(allowed);
            });
        Mock<IAgentCompletionClient> inner = new();
        ContentSafetyEnforcingAgentCompletionClient sut = CreateSut(inner.Object, guard.Object);

        Func<Task> invoke = () => sut.CompleteJsonAsync("sys", "user", cancellationToken: caller.Token);

        await invoke.Should().ThrowAsync<OperationCanceledException>();
        guard.Verify(g => g.CheckInputAsync("user", It.IsAny<CancellationToken>()), Times.Never);
        guard.Verify(g => g.CheckOutputAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
        inner.Verify(g => g.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(),
            It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CompleteJsonAsync_when_inner_completes_late_does_not_start_output_safety_scan()
    {
        using CancellationTokenSource caller = new();
        ContentSafetyResult allowed = new(true, null, null, null);
        Mock<IContentSafetyGuard> guard = new();
        guard.Setup(g => g.CheckInputAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(allowed);
        FakeAgentCompletionClient inner = new((_, _) =>
        {
            caller.Cancel();
            return "{\"late\":true}";
        });
        ContentSafetyEnforcingAgentCompletionClient sut = CreateSut(inner, guard.Object);

        Func<Task> invoke = () => sut.CompleteJsonAsync("sys", "user", cancellationToken: caller.Token);

        await invoke.Should().ThrowAsync<OperationCanceledException>();
        guard.Verify(g => g.CheckOutputAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CompleteJsonAsync_when_output_safety_scan_returns_after_cancellation_rejects_late_approval()
    {
        using CancellationTokenSource caller = new();
        ContentSafetyResult allowed = new(true, null, null, null);
        Mock<IContentSafetyGuard> guard = new();
        guard.Setup(g => g.CheckInputAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(allowed);
        guard.Setup(g => g.CheckOutputAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns((string value, CancellationToken token) =>
            {
                caller.Cancel();
                return Task.FromResult(allowed);
            });
        FakeAgentCompletionClient inner = new((_, _) => "{\"allowed\":true}");
        ContentSafetyEnforcingAgentCompletionClient sut = CreateSut(inner, guard.Object);

        Func<Task> invoke = () => sut.CompleteJsonAsync("sys", "user", cancellationToken: caller.Token);

        await invoke.Should().ThrowAsync<OperationCanceledException>();
        guard.Verify(g => g.CheckOutputAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task StreamJsonAsync_when_input_safety_scan_cancels_never_starts_completion()
    {
        using CancellationTokenSource caller = new();
        ContentSafetyResult allowed = new(true, null, null, null);
        Mock<IContentSafetyGuard> guard = new();
        guard.Setup(g => g.CheckInputAsync("sys", It.IsAny<CancellationToken>()))
            .Returns((string value, CancellationToken token) =>
            {
                caller.Cancel();
                return Task.FromResult(allowed);
            });
        Mock<IAgentCompletionClient> inner = new();
        ContentSafetyEnforcingAgentCompletionClient sut = CreateSut(inner.Object, guard.Object);

        Func<Task> invoke = async () =>
        {
            await foreach (string _ in sut.StreamJsonAsync("sys", "user", cancellationToken: caller.Token))
            {
            }
        };

        await invoke.Should().ThrowAsync<OperationCanceledException>();
        guard.Verify(g => g.CheckInputAsync("user", It.IsAny<CancellationToken>()), Times.Never);
        inner.Verify(g => g.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(),
            It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()), Times.Never);
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
    public async Task StreamJsonAsync_when_evaluation_disabled_skips_output_scan_and_yields_chunks()
    {
        Mock<IContentSafetyGuard> guard = new();
        guard.Setup(g => g.CheckOutputAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ContentSafetyResult(false, "blocked output", "Hate", 6));

        FakeAgentCompletionClient inner = new((_, _) => "{\"bypasses_output_scan\":true}");
        ContentSafetyEnforcingAgentCompletionClient sut = new(
            inner,
            guard.Object,
            new FixedValueOptionsMonitor<ContentSafetyOptions>(
                new ContentSafetyOptions { EvaluateCompletionPromptAndResponse = false }),
            NullLogger<ContentSafetyEnforcingAgentCompletionClient>.Instance);

        List<string> chunks = [];

        await foreach (string chunk in sut.StreamJsonAsync("sys", "user", cancellationToken: CancellationToken.None))
            chunks.Add(chunk);

        chunks.Should().NotBeEmpty();
        string.Join(string.Empty, chunks).Should().Contain("bypasses_output_scan");
        guard.Verify(
            g => g.CheckOutputAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task CompleteJsonAsync_when_evaluation_disabled_skips_guard_scans_and_returns_inner_json()
    {
        Mock<IContentSafetyGuard> guard = new();
        guard.Setup(g => g.CheckInputAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ContentSafetyResult(false, "blocked input", "Hate", 6));
        guard.Setup(g => g.CheckOutputAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ContentSafetyResult(false, "blocked output", "Hate", 6));

        FakeAgentCompletionClient inner = new((_, _) => "{\"bypasses_guard\":true}");
        ContentSafetyEnforcingAgentCompletionClient sut = new(
            inner,
            guard.Object,
            new FixedValueOptionsMonitor<ContentSafetyOptions>(
                new ContentSafetyOptions { EvaluateCompletionPromptAndResponse = false }),
            NullLogger<ContentSafetyEnforcingAgentCompletionClient>.Instance);

        string json = await sut.CompleteJsonAsync("sys", "user", cancellationToken: CancellationToken.None);

        json.Should().Contain("bypasses_guard");
        guard.Verify(
            g => g.CheckInputAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
        guard.Verify(
            g => g.CheckOutputAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task StreamJsonAsync_when_system_prompt_blocked_does_not_invoke_inner_stream()
    {
        Mock<IContentSafetyGuard> guard = new();
        guard.Setup(g => g.CheckInputAsync("blocked-system", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ContentSafetyResult(false, "blocked system", "Hate", 6));

        int innerInvocations = 0;
        FakeAgentCompletionClient inner = new((_, _) =>
        {
            innerInvocations++;
            return "{\"never\":true}";
        });
        ContentSafetyEnforcingAgentCompletionClient sut = CreateSut(inner, guard.Object);

        Func<Task> act = async () =>
        {
            await foreach (string _ in sut.StreamJsonAsync(
                               "blocked-system",
                               "user",
                               cancellationToken: CancellationToken.None))
            {
            }
        };

        await act.Should().ThrowAsync<InvalidOperationException>();
        innerInvocations.Should().Be(0, "blocked system prompt must not start streaming completion");
    }

    [Fact]
    public async Task StreamJsonAsync_when_user_prompt_blocked_does_not_invoke_inner_stream()
    {
        Mock<IContentSafetyGuard> guard = new();
        guard.Setup(g => g.CheckInputAsync("safe-system", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ContentSafetyResult(true, null, null, null));
        guard.Setup(g => g.CheckInputAsync("blocked-user", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ContentSafetyResult(false, "blocked user", "Violence", 6));

        int innerInvocations = 0;
        FakeAgentCompletionClient inner = new((_, _) =>
        {
            innerInvocations++;
            return "{\"never\":true}";
        });
        ContentSafetyEnforcingAgentCompletionClient sut = CreateSut(inner, guard.Object);

        Func<Task> act = async () =>
        {
            await foreach (string _ in sut.StreamJsonAsync(
                               "safe-system",
                               "blocked-user",
                               cancellationToken: CancellationToken.None))
            {
            }
        };

        await act.Should().ThrowAsync<InvalidOperationException>();
        innerInvocations.Should().Be(0, "blocked user prompt must not start streaming completion");
    }

    [Fact]
    public async Task CompleteJsonAsync_when_output_blocked_throws_without_returning_inner_json()
    {
        Mock<IContentSafetyGuard> guard = new();
        guard.Setup(g => g.CheckInputAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ContentSafetyResult(true, null, null, null));
        guard.Setup(g => g.CheckOutputAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ContentSafetyResult(false, "blocked output", "Hate", 6));

        FakeAgentCompletionClient inner = new((_, _) => "{\"must_not_return\":true}");
        ContentSafetyEnforcingAgentCompletionClient sut = CreateSut(inner, guard.Object);

        Func<Task> act = async () =>
            await sut.CompleteJsonAsync("sys", "user", cancellationToken: CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>();
        guard.Verify(
            g => g.CheckOutputAsync("{\"must_not_return\":true}", It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task StreamJsonAsync_when_output_blocked_still_invokes_inner_before_throw()
    {
        Mock<IContentSafetyGuard> guard = new();
        guard.Setup(g => g.CheckInputAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ContentSafetyResult(true, null, null, null));
        guard.Setup(g => g.CheckOutputAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ContentSafetyResult(false, "blocked output", "Hate", 6));

        int innerInvocations = 0;
        FakeAgentCompletionClient inner = new((_, _) =>
        {
            innerInvocations++;
            return "{\"blocked\":true}";
        });
        ContentSafetyEnforcingAgentCompletionClient sut = CreateSut(inner, guard.Object);

        Func<Task> act = async () =>
        {
            await foreach (string _ in sut.StreamJsonAsync("sys", "user", cancellationToken: CancellationToken.None))
            {
            }
        };

        await act.Should().ThrowAsync<InvalidOperationException>();
        innerInvocations.Should().BeGreaterThan(0, "output scan runs after the inner stream completes");
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
