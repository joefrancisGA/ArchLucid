using System.ClientModel;
using System.ClientModel.Primitives;
using System.Diagnostics;
using System.Net;

using Azure.AI.OpenAI;

using OpenAI.Chat;

namespace ArchLucid.AgentRuntime.Tests.Configuration;

/// <summary>
/// Exercises the actual Azure OpenAI SDK HTTP pipeline with an in-process transport that
/// never produces a response. No DNS, network listener, Azure credentials, or cloud calls.
/// </summary>
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class AzureOpenAiCompletionStalledTransportTests
{
    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Sdk_network_timeout_aborts_stalled_chat_transport(bool streaming)
    {
        using StalledHttpMessageHandler stalled = new();
        using HttpClient http = new(stalled) { Timeout = Timeout.InfiniteTimeSpan };
        AzureOpenAIClientOptions options =
            AzureOpenAiCompletionClient.CreateClientOptions(TimeSpan.FromSeconds(5));
        // No SDK retries: isolate the configured per-network-operation timeout.
        options.RetryPolicy = new ClientRetryPolicy(0);
        options.Transport = new HttpClientPipelineTransport(http);

        AzureOpenAIClient sdk = new(
            new Uri("https://unit-test.openai.azure.com/"),
            new ApiKeyCredential("not-a-live-azure-key"),
            options);
        ChatClient chat = sdk.GetChatClient("unit-test-deployment");

        // Safety only: if the SDK timeout is broken, fail rather than hang CI indefinitely.
        using CancellationTokenSource safety = new(TimeSpan.FromSeconds(20));
        Stopwatch elapsed = Stopwatch.StartNew();
        Task<Exception?> invocation = Record.ExceptionAsync(
            () => InvokeChatAsync(chat, streaming, safety.Token));

        // Prove the test reached the HTTP send path before assessing timeout behavior.
        await stalled.Entered.WaitAsync(TimeSpan.FromSeconds(5));
        Exception? error = await invocation.WaitAsync(TimeSpan.FromSeconds(20));
        elapsed.Stop();

        Assert.NotNull(error);
        Assert.Equal(1, stalled.RequestCount);
        Assert.True(stalled.CancellationObserved,
            "The SDK timeout must cancel the in-flight HTTP transport.");
        Assert.False(safety.IsCancellationRequested,
            "The SDK network timeout must fire before the test safety deadline.");
        Assert.True(elapsed.Elapsed < TimeSpan.FromSeconds(15),
            $"A 5-second network timeout should abort promptly (elapsed {elapsed.Elapsed}).");
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Caller_cancellation_aborts_stalled_chat_transport_before_network_timeout(bool streaming)
    {
        using StalledHttpMessageHandler stalled = new();
        using HttpClient http = new(stalled) { Timeout = Timeout.InfiniteTimeSpan };
        AzureOpenAIClientOptions options =
            AzureOpenAiCompletionClient.CreateClientOptions(TimeSpan.FromSeconds(5));
        options.RetryPolicy = new ClientRetryPolicy(0);
        options.Transport = new HttpClientPipelineTransport(http);

        AzureOpenAIClient sdk = new(
            new Uri("https://unit-test.openai.azure.com/"),
            new ApiKeyCredential("not-a-live-azure-key"),
            options);
        ChatClient chat = sdk.GetChatClient("unit-test-deployment");
        using CancellationTokenSource caller = new();

        Task<Exception?> invocation = Record.ExceptionAsync(
            () => InvokeChatAsync(chat, streaming, caller.Token));
        await stalled.Entered.WaitAsync(TimeSpan.FromSeconds(5));

        caller.Cancel();

        Exception? error = await invocation.WaitAsync(TimeSpan.FromSeconds(5));
        Assert.NotNull(error);
        Assert.True(stalled.CancellationObserved);
        Assert.Equal(1, stalled.RequestCount);
    }

    private static async Task InvokeChatAsync(ChatClient chat, bool streaming, CancellationToken ct)
    {
        ChatMessage[] messages = [new UserChatMessage("Return a JSON object.")];
        ChatCompletionOptions options = new()
        {
            ResponseFormat = ChatResponseFormat.CreateJsonObjectFormat(),
        };

        if (streaming)
        {
            await foreach (StreamingChatCompletionUpdate _ in
                           chat.CompleteChatStreamingAsync(messages, options, ct))
            {
            }
        }
        else
        {
            await chat.CompleteChatAsync(messages, options, ct);
        }
    }

    private sealed class StalledHttpMessageHandler : HttpMessageHandler
    {
        private readonly TaskCompletionSource<bool> _entered =
            new(TaskCreationOptions.RunContinuationsAsynchronously);
        private int _requests;
        private int _canceled;

        public Task Entered => _entered.Task;
        public int RequestCount => Volatile.Read(ref _requests);
        public bool CancellationObserved => Volatile.Read(ref _canceled) != 0;

        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            Interlocked.Increment(ref _requests);
            _entered.TrySetResult(true);

            try
            {
                // Simulate an HTTP connection whose peer never sends response headers.
                await Task.Delay(Timeout.InfiniteTimeSpan, cancellationToken)
                    .ConfigureAwait(false);
                throw new InvalidOperationException("Stalled transport unexpectedly returned.");
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                Volatile.Write(ref _canceled, 1);
                throw;
            }
        }
    }
}
