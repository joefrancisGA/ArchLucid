using System.Collections.Concurrent;
using System.Net;
using System.Net.Http.Json;

using ArchLucid.Persistence.Billing;
using ArchLucid.Persistence.Billing.AzureMarketplace;

namespace ArchLucid.Persistence.Tests.Billing;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class MarketplaceFulfillmentActivationTests
{
    [Fact]
    public async Task A_subscribed_result_skips_the_activation_post()
    {
        Guid subscription = Guid.NewGuid();
        ActivationTransport transport = new(subscription, HttpStatusCode.OK, "Subscribed");
        using ActivationClientFactory factory = new(transport);

        await EnsureAsync(factory, new InMemoryBillingLedger(), subscription);

        Assert.Equal(new[] { HttpMethod.Get }, transport.Methods);
    }

    [Fact]
    public async Task The_first_pending_subscription_can_submit_once()
    {
        Guid subscription = Guid.NewGuid();
        ActivationTransport transport = new(subscription, HttpStatusCode.OK, "PendingFulfillmentStart");
        using ActivationClientFactory factory = new(transport);

        await EnsureAsync(factory, new InMemoryBillingLedger(), subscription);

        Assert.Equal(new[] { HttpMethod.Get, HttpMethod.Post }, transport.Methods);
    }

    [Theory]
    [InlineData(null)]
    [InlineData(HttpStatusCode.ServiceUnavailable)]
    public async Task An_uncertain_activation_is_resolved_by_reading_subscribed_state(HttpStatusCode? outcome)
    {
        Guid subscription = Guid.NewGuid();
        ActivationTransport transport = new(subscription, outcome, "PendingFulfillmentStart", "Subscribed");
        using ActivationClientFactory factory = new(transport);

        await EnsureAsync(factory, new InMemoryBillingLedger(), subscription);

        Assert.Equal(new[] { HttpMethod.Get, HttpMethod.Post, HttpMethod.Get }, transport.Methods);
    }

    [Fact]
    public async Task Redelivery_after_a_pending_read_reconciles_without_resubmitting()
    {
        Guid subscription = Guid.NewGuid();
        InMemoryBillingLedger ledger = new();
        ActivationTransport first = new(subscription, null, "PendingFulfillmentStart", "PendingFulfillmentStart");
        ActivationTransport redelivery = new(subscription, null, "PendingFulfillmentStart", "Subscribed");
        using ActivationClientFactory initial = new(first);
        using ActivationClientFactory restarted = new(redelivery);

        await Assert.ThrowsAsync<InvalidOperationException>(() => EnsureAsync(initial, ledger, subscription));
        await Assert.ThrowsAsync<InvalidOperationException>(() => EnsureAsync(restarted, ledger, subscription));
        await EnsureAsync(restarted, ledger, subscription);

        Assert.Equal(new[] { HttpMethod.Get, HttpMethod.Post, HttpMethod.Get }, first.Methods);
        Assert.Equal(new[] { HttpMethod.Get, HttpMethod.Get }, redelivery.Methods);
    }

    [Fact]
    public async Task A_status_for_a_different_subscription_prevents_dispatch()
    {
        Guid subscription = Guid.NewGuid();
        ActivationTransport transport = new(Guid.NewGuid(), HttpStatusCode.OK, "PendingFulfillmentStart");
        using ActivationClientFactory factory = new(transport);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            EnsureAsync(factory, new InMemoryBillingLedger(), subscription));

        Assert.Equal(new[] { HttpMethod.Get }, transport.Methods);
    }

    [Fact]
    public async Task Concurrent_dispatchers_share_only_one_activation_admission()
    {
        Guid subscription = Guid.NewGuid();
        InMemoryBillingLedger ledger = new();
        TaskCompletionSource bothReading = new(TaskCreationOptions.RunContinuationsAsynchronously);
        ActivationTransport transport = new(
            subscription, HttpStatusCode.OK, "PendingFulfillmentStart", "PendingFulfillmentStart")
        {
            BeforeRead = count =>
            {
                if (count == 2)
                    bothReading.TrySetResult();

                return bothReading.Task;
            },
        };
        using ActivationClientFactory first = new(transport);
        using ActivationClientFactory second = new(transport);

        Task<Exception?>[] submissions =
        [
            Record.ExceptionAsync(() => EnsureAsync(first, ledger, subscription)),
            Record.ExceptionAsync(() => EnsureAsync(second, ledger, subscription)),
        ];
        Exception?[] outcomes = await Task.WhenAll(submissions).WaitAsync(TimeSpan.FromSeconds(5));

        Assert.Single(outcomes, outcome => outcome is null);
        Assert.IsType<InvalidOperationException>(Assert.Single(outcomes, outcome => outcome is not null));
        Assert.Single(transport.Methods, method => method == HttpMethod.Post);
    }

    private static Task EnsureAsync(ActivationClientFactory factory, InMemoryBillingLedger ledger, Guid subscription) =>
        MarketplaceFulfillmentActivation.EnsureAsync(factory, ledger, subscription, "test-token", CancellationToken.None);

    internal sealed class ActivationClientFactory(ActivationTransport handler) : IHttpClientFactory, IDisposable
    {
        public HttpClient CreateClient(string name)
        {
            Assert.Contains(name, new[] { nameof(AzureMarketplaceBillingProvider), AzureMarketplaceBillingProvider.ActivationStatusHttpClientName });

            return new HttpClient(handler, disposeHandler: false);
        }

        public void Dispose() => handler.Dispose();
    }

    internal sealed class ActivationTransport(Guid subscription, HttpStatusCode? postOutcome, params string[] states) : HttpMessageHandler
    {
        public ConcurrentQueue<HttpMethod> Methods { get; } = new();
        public Func<int, Task>? BeforeRead { get; init; }
        private int _readCount;

        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken)
        {
            cancellationToken.ThrowIfCancellationRequested();
            Assert.Equal("test-token", request.Headers.Authorization?.Parameter);
            Methods.Enqueue(request.Method);

            if (request.Method == HttpMethod.Post)
                return postOutcome is { } status ? new HttpResponseMessage(status)
                    : throw new HttpRequestException("Synthetic lost response.");

            Assert.Equal(HttpMethod.Get, request.Method);
            int readCount = Interlocked.Increment(ref _readCount);

            if (BeforeRead is { } beforeRead)
                await beforeRead(readCount).WaitAsync(cancellationToken);

            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = JsonContent.Create(new { id = subscription, saasSubscriptionStatus = states[readCount - 1] }),
            };
        }
    }
}
