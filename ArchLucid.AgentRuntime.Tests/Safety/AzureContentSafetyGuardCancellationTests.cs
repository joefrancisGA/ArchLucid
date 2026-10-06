using ArchLucid.AgentRuntime.Safety;
using ArchLucid.Core.Configuration;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.AgentRuntime.Tests.Safety;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AzureContentSafetyGuardCancellationTests
{
    [Fact]
    public async Task CheckInputAsync_when_token_cancelled_and_text_is_whitespace_throws_operation_canceled()
    {
        AzureContentSafetyGuard guard = CreateGuard();

        using CancellationTokenSource cts = new();
        await cts.CancelAsync();

        Func<Task> act = () => guard.CheckInputAsync("   ", cts.Token);

        await act.Should().ThrowAsync<OperationCanceledException>();
    }

    [Fact]
    public async Task CheckOutputAsync_when_token_cancelled_and_text_is_whitespace_throws_operation_canceled()
    {
        AzureContentSafetyGuard guard = CreateGuard();

        using CancellationTokenSource cts = new();
        await cts.CancelAsync();

        Func<Task> act = () => guard.CheckOutputAsync("\t", cts.Token);

        await act.Should().ThrowAsync<OperationCanceledException>();
    }

    private static AzureContentSafetyGuard CreateGuard()
    {
        Mock<IOptionsMonitor<ContentSafetyOptions>> optionsMonitor = new();
        optionsMonitor.Setup(m => m.CurrentValue).Returns(new ContentSafetyOptions { BlockSeverityThreshold = 4 });

        return new AzureContentSafetyGuard(
            new Uri("https://example.cognitiveservices.azure.com/"),
            "test-key",
            optionsMonitor.Object,
            NullLogger<AzureContentSafetyGuard>.Instance);
    }
}
