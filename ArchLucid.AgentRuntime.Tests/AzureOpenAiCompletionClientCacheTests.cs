using ArchLucid.AgentRuntime;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
public sealed class AzureOpenAiCompletionClientCacheTests
{
    [Fact]
    public void TryRemove_disposes_and_evicts_cached_client()
    {
        int factoryCalls = 0;
        using AzureOpenAiCompletionClientCache cache = new(deploymentName =>
        {
            factoryCalls++;
            return new AzureOpenAiCompletionClient("https://example.invalid", "key", deploymentName, 1024);
        });

        AzureOpenAiCompletionClient first = cache.GetOrAdd("gpt-4o");
        factoryCalls.Should().Be(1);

        cache.GetOrAdd(" GPT-4O ").Should().BeSameAs(first);
        cache.TryRemove(" GPT-4O ").Should().BeTrue();

        AzureOpenAiCompletionClient second = cache.GetOrAdd("gpt-4o");
        factoryCalls.Should().Be(2);
        second.Should().NotBeSameAs(first);
    }

    [Fact]
    public async Task GetOrAdd_constructs_one_client_for_concurrent_requests_for_the_same_deployment()
    {
        TaskCompletionSource firstFactoryEntered = new(TaskCreationOptions.RunContinuationsAsynchronously);
        TaskCompletionSource secondRequestStarted = new(TaskCreationOptions.RunContinuationsAsynchronously);
        using ManualResetEventSlim secondFactoryEntered = new();
        using ManualResetEventSlim releaseFirstFactory = new();
        int factoryCalls = 0;
        using AzureOpenAiCompletionClientCache cache = new(deploymentName =>
        {
            if (Interlocked.Increment(ref factoryCalls) == 1)
            {
                firstFactoryEntered.SetResult();
                if (!releaseFirstFactory.Wait(TimeSpan.FromSeconds(15)))
                    throw new TimeoutException("The first cache factory was not released.");
            }
            else
            {
                secondFactoryEntered.Set();
            }

            return new AzureOpenAiCompletionClient("https://example.invalid", "key", deploymentName, 1024);
        });

        Task<AzureOpenAiCompletionClient> first = Task.Run(() => cache.GetOrAdd("gpt-4o"));
        Task<AzureOpenAiCompletionClient>? second = null;
        try
        {
            await firstFactoryEntered.Task.WaitAsync(TimeSpan.FromSeconds(5));
            second = Task.Factory.StartNew(
                () =>
                {
                    secondRequestStarted.SetResult();
                    return cache.GetOrAdd(" GPT-4O ");
                },
                CancellationToken.None,
                TaskCreationOptions.LongRunning,
                TaskScheduler.Default);
            await secondRequestStarted.Task.WaitAsync(TimeSpan.FromSeconds(5));

            // Keep the first factory in flight long enough for the overlapping request to contend.
            secondFactoryEntered.Wait(TimeSpan.FromSeconds(1));
        }
        finally
        {
            releaseFirstFactory.Set();
        }

        AzureOpenAiCompletionClient[] clients = await Task.WhenAll(first, second!);
        clients[1].Should().BeSameAs(clients[0]);
        factoryCalls.Should().Be(1);
    }

    [Fact]
    public void GetOrAdd_retries_after_factory_failure()
    {
        int factoryCalls = 0;
        using AzureOpenAiCompletionClientCache cache = new(deploymentName =>
        {
            if (++factoryCalls == 1)
                throw new InvalidOperationException("Transient client creation failure.");

            return new AzureOpenAiCompletionClient("https://example.invalid", "key", deploymentName, 1024);
        });

        Assert.Throws<InvalidOperationException>(() => cache.GetOrAdd("gpt-4o"));
        AzureOpenAiCompletionClient client = cache.GetOrAdd("gpt-4o");

        cache.GetOrAdd("gpt-4o").Should().BeSameAs(client);
        factoryCalls.Should().Be(2);
    }

    [Fact]
    public void Dispose_empties_cache_and_prevents_new_client_creation()
    {
        int factoryCalls = 0;
        using AzureOpenAiCompletionClientCache cache = new(deploymentName =>
        {
            factoryCalls++;
            return new AzureOpenAiCompletionClient("https://example.invalid", "key", deploymentName, 1024);
        });
        cache.GetOrAdd("gpt-4o");

        cache.Dispose();

        cache.TryRemove("gpt-4o").Should().BeFalse();
        Assert.Throws<ObjectDisposedException>(() => cache.GetOrAdd("gpt-4o"));
        Assert.Throws<ObjectDisposedException>(() => cache.GetOrAdd("other"));
        factoryCalls.Should().Be(1);
    }
}
