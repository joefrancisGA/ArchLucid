using ArchLucid.Host.Core.Http;

using Microsoft.Extensions.DependencyInjection;

using Polly;

namespace ArchLucid.Host.Core.Tests.Http;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class LongLivedHttpClientAsyncPolicyTests
{
    private static readonly TimeSpan TestTimeout = TimeSpan.FromSeconds(5);

    [Fact]
    public async Task Concurrent_first_calls_share_one_stateful_policy()
    {
        using ServiceProvider provider = new ServiceCollection().BuildServiceProvider();
        using ManualResetEventSlim release = new(false);
        TaskCompletionSource firstFactoryStarted = new(TaskCreationOptions.RunContinuationsAsynchronously);
        TaskCompletionSource secondCallStarted = new(TaskCreationOptions.RunContinuationsAsynchronously);
        TaskCompletionSource secondFactoryStarted = new(TaskCreationOptions.RunContinuationsAsynchronously);
        int calls = 0;

        LongLivedHttpClientAsyncPolicy<HttpResponseMessage> policy = new(_ =>
        {
            if (Interlocked.Increment(ref calls) == 1)
                firstFactoryStarted.TrySetResult();
            else
                secondFactoryStarted.TrySetResult();

            Assert.True(release.Wait(TestTimeout));
            return Policy.NoOpAsync<HttpResponseMessage>();
        });

        Task<IAsyncPolicy<HttpResponseMessage>> first = Task.Factory.StartNew(
            () => policy.Get(provider), CancellationToken.None, TaskCreationOptions.LongRunning, TaskScheduler.Default);

        try
        {
            await firstFactoryStarted.Task.WaitAsync(TestTimeout);
            Task<IAsyncPolicy<HttpResponseMessage>> second = Task.Factory.StartNew(
                () =>
                {
                    secondCallStarted.TrySetResult();
                    return policy.Get(provider);
                },
                CancellationToken.None,
                TaskCreationOptions.LongRunning,
                TaskScheduler.Default);

            await secondCallStarted.Task.WaitAsync(TestTimeout);
            await Task.WhenAny(secondFactoryStarted.Task, Task.Delay(TimeSpan.FromMilliseconds(200)));
            release.Set();
            IAsyncPolicy<HttpResponseMessage>[] results = await Task.WhenAll(first, second).WaitAsync(TestTimeout);

            Assert.Equal(1, calls);
            Assert.Same(results[0], results[1]);
        }
        finally
        {
            release.Set();
            await first.WaitAsync(TestTimeout);
        }
    }
}
