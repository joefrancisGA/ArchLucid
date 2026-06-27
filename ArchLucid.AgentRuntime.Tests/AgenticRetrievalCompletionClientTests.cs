using ArchLucid.AgentRuntime;
using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;
using ArchLucid.Retrieval.Agentic;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Suite", "Core")]
public sealed class AgenticRetrievalCompletionClientTests
{
    [Fact]
    public async Task RewriteQueryAsync_when_completion_exceeds_expansion_budget_falls_back_to_heuristic()
    {
        AgenticRetrievalCompletionClient sut = CreateSut(
            new DelayingCompletionClient(TimeSpan.FromSeconds(30)),
            new AdvancedRetrievalOptions { ExpansionTimeoutSeconds = 1 });

        string result = await sut.RewriteQueryAsync("topology services", CancellationToken.None);

        result.Should().Be(AgenticRetrievalHeuristics.RewriteQuery("topology services"));
    }

    [Fact]
    public async Task RewriteQueryAsync_when_caller_cancels_propagates_operation_canceled()
    {
        AgenticRetrievalCompletionClient sut = CreateSut(
            new DelayingCompletionClient(TimeSpan.FromSeconds(30)),
            new AdvancedRetrievalOptions { ExpansionTimeoutSeconds = 30 });

        using CancellationTokenSource cancellation = new();
        cancellation.Cancel();

        Func<Task> act = () => sut.RewriteQueryAsync("topology services", cancellation.Token);

        await act.Should().ThrowAsync<OperationCanceledException>();
    }

    private static AgenticRetrievalCompletionClient CreateSut(
        IAgentCompletionClient inner,
        AdvancedRetrievalOptions options)
    {
        PassThroughAgentTierCompletionRouter router =
            AgentTierCompletionRouterTestFactory.CreatePassThrough(inner);

        return new AgenticRetrievalCompletionClient(
            router,
            new MockOptionsMonitor<AdvancedRetrievalOptions>(options),
            NullLogger<AgenticRetrievalCompletionClient>.Instance);
    }

    private sealed class DelayingCompletionClient(TimeSpan delay) : IAgentCompletionClient
    {
        public LlmProviderDescriptor Descriptor => LlmProviderDescriptor.ForOffline("delay", "delay");

        public async Task<string> CompleteJsonAsync(
            string systemPrompt,
            string userPrompt,
            int? maxTokens = null,
            float? temperature = null,
            CancellationToken cancellationToken = default)
        {
            await Task.Delay(delay, cancellationToken);

            return "delayed-llm";
        }
    }

    private sealed class MockOptionsMonitor<T>(T value) : IOptionsMonitor<T> where T : class
    {
        public T CurrentValue { get; } = value;

        public T Get(string? name) => CurrentValue;

        public IDisposable OnChange(Action<T, string?> listener) => NullDisposable.Instance;

        private sealed class NullDisposable : IDisposable
        {
            internal static readonly NullDisposable Instance = new();

            public void Dispose()
            {
            }
        }
    }
}
