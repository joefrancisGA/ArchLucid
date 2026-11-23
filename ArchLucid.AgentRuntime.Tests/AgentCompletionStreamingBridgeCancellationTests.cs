using System.Runtime.CompilerServices;

using ArchLucid.AgentRuntime;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AgentCompletionStreamingBridgeCancellationTests
{
    [Fact]
    public async Task Simulated_stream_rejects_result_returned_after_caller_canceled()
    {
        using CancellationTokenSource caller = new();
        IAgentCompletionClient client = new DelegateCompletionClient(_ =>
        {
            caller.Cancel();
            return Task.FromResult(new string('x', 120));
        });

        await using IAsyncEnumerator<string> enumerator = AgentCompletionStreamingBridge
            .StreamJsonAsync(client, "system", "user", cancellationToken: caller.Token)
            .GetAsyncEnumerator();

        await Assert.ThrowsAnyAsync<OperationCanceledException>(
            async () => { await enumerator.MoveNextAsync(); });
    }

    [Fact]
    public async Task Simulated_stream_stops_between_buffered_chunks_after_cancellation()
    {
        using CancellationTokenSource caller = new();
        IAgentCompletionClient client = new DelegateCompletionClient(
            _ => Task.FromResult(new string('x', 120)));

        await using IAsyncEnumerator<string> enumerator = AgentCompletionStreamingBridge
            .StreamJsonAsync(client, "system", "user", cancellationToken: caller.Token)
            .GetAsyncEnumerator();

        Assert.True(await enumerator.MoveNextAsync());
        Assert.Equal(48, enumerator.Current.Length);

        caller.Cancel();

        await Assert.ThrowsAnyAsync<OperationCanceledException>(
            async () => { await enumerator.MoveNextAsync(); });
    }

    [Fact]
    public async Task Live_stream_stops_even_if_inner_provider_ignores_cancelled_token()
    {
        using CancellationTokenSource caller = new();
        IAgentCompletionClient client = new NonCooperativeStreamingClient();

        await using IAsyncEnumerator<string> enumerator = AgentCompletionStreamingBridge
            .StreamJsonAsync(client, "system", "user", cancellationToken: caller.Token)
            .GetAsyncEnumerator();

        Assert.True(await enumerator.MoveNextAsync());
        Assert.Equal("first", enumerator.Current);

        caller.Cancel();

        await Assert.ThrowsAnyAsync<OperationCanceledException>(
            async () => { await enumerator.MoveNextAsync(); });
    }

    private sealed class DelegateCompletionClient(
        Func<CancellationToken, Task<string>> complete) : IAgentCompletionClient
    {
        public LlmProviderDescriptor Descriptor => LlmProviderDescriptor.ForOffline("stub", "stub");

        public Task<string> CompleteJsonAsync(
            string systemPrompt,
            string userPrompt,
            int? maxTokens = null,
            float? temperature = null,
            CancellationToken cancellationToken = default) =>
            complete(cancellationToken);
    }

    private sealed class NonCooperativeStreamingClient : IAgentStreamingCompletionClient
    {
        public LlmProviderDescriptor Descriptor => LlmProviderDescriptor.ForOffline("stub", "streaming");

        public Task<string> CompleteJsonAsync(
            string systemPrompt,
            string userPrompt,
            int? maxTokens = null,
            float? temperature = null,
            CancellationToken cancellationToken = default) =>
            Task.FromResult("not used");

        public async IAsyncEnumerable<string> StreamJsonAsync(
            string systemPrompt,
            string userPrompt,
            int? maxTokens = null,
            float? temperature = null,
            [EnumeratorCancellation] CancellationToken cancellationToken = default)
        {
            yield return "first";
            await Task.Yield();
            yield return "second";
        }
    }
}
