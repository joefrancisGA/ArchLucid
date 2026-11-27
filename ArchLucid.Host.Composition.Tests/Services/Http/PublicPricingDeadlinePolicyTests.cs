using System.Globalization;
using System.Net;
using System.Net.Http.Headers;
using System.Threading.Channels;

using ArchLucid.Core.Http;
using AzureRetailPricesHttpResiliencePolicy = ArchLucid.Host.Core.Http.AzureRetailPricesHttpResiliencePolicy;
using ArchLucid.Host.Composition.Startup;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Time.Testing;

using Polly.CircuitBreaker;

namespace ArchLucid.Host.Composition.Tests.Services.Http;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class PublicPricingDeadlinePolicyTests
{
    private const string CatalogPath = "catalog";
    private const string Azure = ArchLucidAzurePublicHttpClients.RetailPricesHttpClientName;
    private const string Aws = ArchLucidMultiCloudPublicHttpClients.AwsPricingHttpClientName;
    private const string Gcp = ArchLucidMultiCloudPublicHttpClients.GcpCloudBillingHttpClientName;
    private static readonly string[] ClientNames = [Azure, Aws, Gcp];
    private static readonly TimeSpan TestTimeout = TimeSpan.FromSeconds(5);

    [Theory]
    [InlineData(Azure, HttpStatusCode.TooManyRequests, false)]
    [InlineData(Azure, HttpStatusCode.ServiceUnavailable, true)]
    [InlineData(Aws, HttpStatusCode.TooManyRequests, false)]
    [InlineData(Aws, HttpStatusCode.ServiceUnavailable, true)]
    [InlineData(Gcp, HttpStatusCode.TooManyRequests, false)]
    [InlineData(Gcp, HttpStatusCode.ServiceUnavailable, true)]
    public async Task Pricing_client_waits_for_retry_after(string clientName, HttpStatusCode statusCode, bool useHttpDate)
    {
        FakeTimeProvider clock = new();
        TimeSpan delay = TimeSpan.FromSeconds(5);
        using HttpResponseMessage transient = new(statusCode);
        transient.Headers.RetryAfter = useHttpDate
            ? new RetryConditionHeaderValue(clock.GetUtcNow() + delay)
            : new RetryConditionHeaderValue(delay);

        RecordingHandler handler = new(_ => transient);
        await using ServiceProvider services = CreateServices(clock, clientName, handler);
        using HttpClient client = CreateClient(services, clientName);

        Task<HttpResponseMessage> pending = client.GetAsync(CatalogPath);
        Assert.Equal(1, handler.SendCount);
        Assert.False(pending.IsCompleted);

        clock.Advance(TimeSpan.FromSeconds(4));
        Assert.Equal(1, handler.SendCount);
        Assert.False(pending.IsCompleted);

        clock.Advance(TimeSpan.FromSeconds(1));
        using HttpResponseMessage result = await pending.WaitAsync(TestTimeout);
        Assert.Equal(HttpStatusCode.OK, result.StatusCode);
        Assert.Equal(2, handler.SendCount);
    }

    [Theory]
    [InlineData(Azure, 2)]
    [InlineData(Azure, 3)]
    [InlineData(Aws, 2)]
    [InlineData(Aws, 3)]
    [InlineData(Gcp, 2)]
    [InlineData(Gcp, 3)]
    public async Task Pricing_client_returns_original_response_if_wait_reaches_or_exceeds_deadline(string clientName, int retryAfterSeconds)
    {
        FakeTimeProvider clock = new();
        using HttpResponseMessage transient = new(HttpStatusCode.TooManyRequests)
        {
            Content = new StringContent("catalog is throttled"),
        };
        transient.Headers.RetryAfter = new RetryConditionHeaderValue(TimeSpan.FromSeconds(retryAfterSeconds));
        RecordingHandler handler = new(_ =>
        {
            clock.Advance(TimeSpan.FromMinutes(5) - TimeSpan.FromSeconds(2));
            return transient;
        });
        await using ServiceProvider services = CreateServices(clock, clientName, handler);
        using HttpClient client = CreateClient(services, clientName);

        HttpResponseMessage result = await client.GetAsync(CatalogPath).WaitAsync(TestTimeout);

        Assert.Same(transient, result);
        Assert.Equal(TimeSpan.FromSeconds(retryAfterSeconds), result.Headers.RetryAfter?.Delta);
        Assert.Equal("catalog is throttled", await result.Content.ReadAsStringAsync());
        Assert.Equal(1, handler.SendCount);
    }

    [Theory]
    [InlineData(Azure)]
    [InlineData(Aws)]
    [InlineData(Gcp)]
    public async Task Pricing_client_cancels_retry_after_wait_without_sending_again(string clientName)
    {
        FakeTimeProvider clock = new();
        using HttpResponseMessage transient = new(HttpStatusCode.ServiceUnavailable);
        transient.Headers.RetryAfter = new RetryConditionHeaderValue(TimeSpan.FromSeconds(10));
        RecordingHandler handler = new(_ => transient);
        await using ServiceProvider services = CreateServices(clock, clientName, handler);
        using HttpClient client = CreateClient(services, clientName);
        using CancellationTokenSource cts = new();

        Task<HttpResponseMessage> pending = client.GetAsync(CatalogPath, cts.Token);
        Assert.False(pending.IsCompleted);
        Assert.Equal(1, handler.SendCount);

        await cts.CancelAsync();
        await Assert.ThrowsAnyAsync<OperationCanceledException>(() => pending.WaitAsync(TestTimeout));

        clock.Advance(TimeSpan.FromSeconds(10));
        Assert.Equal(1, handler.SendCount);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("not-a-delay")]
    [InlineData("past-date")]
    [InlineData("0")]
    public async Task Pricing_client_uses_bounded_jitter_when_header_does_not_extend_delay(string? header)
    {
        const string clientName = Azure;
        FakeTimeProvider clock = new();
        using HttpResponseMessage transient = new(HttpStatusCode.ServiceUnavailable);

        if (header is not null)
        {
            transient.Headers.TryAddWithoutValidation(
                "Retry-After",
                header == "past-date" ? clock.GetUtcNow().AddMinutes(-1).ToString("R", CultureInfo.InvariantCulture) : header);
        }

        RecordingHandler handler = new(_ => transient);
        await using ServiceProvider services = CreateServices(clock, clientName, handler);
        using HttpClient client = CreateClient(services, clientName);

        Task<HttpResponseMessage> pending = client.GetAsync(CatalogPath);
        clock.Advance(TimeSpan.FromMilliseconds(999));
        Assert.False(pending.IsCompleted);
        Assert.Equal(1, handler.SendCount);

        clock.Advance(TimeSpan.FromMilliseconds(251));
        using HttpResponseMessage result = await pending.WaitAsync(TestTimeout);
        Assert.Equal(HttpStatusCode.OK, result.StatusCode);
        Assert.Equal(2, handler.SendCount);
    }

    [Theory]
    [InlineData(Azure, "POST", false)]
    [InlineData(Azure, "POST", true)]
    [InlineData(Azure, "GET", true)]
    [InlineData(Aws, "POST", false)]
    [InlineData(Aws, "POST", true)]
    [InlineData(Aws, "GET", true)]
    [InlineData(Gcp, "POST", false)]
    [InlineData(Gcp, "POST", true)]
    [InlineData(Gcp, "GET", true)]
    public async Task Pricing_client_does_not_retry_writes_or_requests_with_content(string clientName, string method, bool hasContent)
    {
        FakeTimeProvider clock = new();
        using HttpResponseMessage transient = new(HttpStatusCode.TooManyRequests);
        transient.Headers.RetryAfter = new RetryConditionHeaderValue(TimeSpan.FromSeconds(10));
        RecordingHandler handler = new(_ => transient);
        await using ServiceProvider services = CreateServices(clock, clientName, handler);
        using HttpClient client = CreateClient(services, clientName);
        using HttpRequestMessage request = new(new HttpMethod(method), CatalogPath);

        if (hasContent)
        {
            request.Content = new StringContent("request payload");
        }

        HttpResponseMessage result = await client.SendAsync(request).WaitAsync(TestTimeout);

        Assert.Same(transient, result);
        Assert.Equal(1, handler.SendCount);
    }

    [Theory]
    [InlineData(Azure)]
    [InlineData(Aws)]
    [InlineData(Gcp)]
    public async Task Pricing_client_sends_at_most_four_attempts_for_a_single_call(string clientName)
    {
        ObservedClock clock = new();
        TimeSpan serverDelay = TimeSpan.FromSeconds(6);
        RecordingHandler handler = new(_ => Throttle(serverDelay), repeatResponse: true);
        await using ServiceProvider services = CreateServices(clock, clientName, handler);
        using HttpClient client = CreateClient(services, clientName);

        Task<HttpResponseMessage> pending = client.GetAsync(CatalogPath);

        for (int retry = 1; retry <= 3; retry++)
        {
            TimeSpan scheduledDelay = await clock.NextTimerAsync().WaitAsync(TestTimeout);
            Assert.Equal(retry, handler.SendCount);
            Assert.Equal(serverDelay, scheduledDelay);
            clock.Advance(scheduledDelay);
        }

        using HttpResponseMessage result = await pending.WaitAsync(TestTimeout);
        Assert.Equal(HttpStatusCode.TooManyRequests, result.StatusCode);
        Assert.Equal(4, handler.SendCount);
    }

    [Theory]
    [InlineData(Azure)]
    [InlineData(Aws)]
    [InlineData(Gcp)]
    public async Task Exhausted_calls_trip_only_their_provider_circuit_and_the_provider_can_recover(string failingName)
    {
        FakeTimeProvider clock = new();
        bool failing = true;
        RecordingHandler handler = new(
            _ => failing ? Throttle(TimeSpan.FromMinutes(6)) : new HttpResponseMessage(HttpStatusCode.OK),
            repeatResponse: true);

        ServiceCollection registrations = CreateRegistrations(clock);
        registrations.AddHttpClient(failingName).ConfigurePrimaryHttpMessageHandler(() => handler);

        foreach (string healthyName in ClientNames.Where(name => name != failingName))
        {
            registrations.AddHttpClient(healthyName).ConfigurePrimaryHttpMessageHandler(
                static () => new RecordingHandler(_ => new HttpResponseMessage(HttpStatusCode.OK)));
        }

        await using ServiceProvider services = registrations.BuildServiceProvider();
        using HttpClient client = CreateClient(services, failingName);
        Assert.Equal(TimeSpan.FromMinutes(5), client.Timeout);

        for (int call = 0; call < AzureRetailPricesHttpResiliencePolicy.CircuitBreakerFailureThreshold; call++)
        {
            using HttpResponseMessage response = await client.GetAsync(CatalogPath).WaitAsync(TestTimeout);
            Assert.Equal(HttpStatusCode.TooManyRequests, response.StatusCode);
        }

        await Assert.ThrowsAnyAsync<BrokenCircuitException>(() => client.GetAsync(CatalogPath).WaitAsync(TestTimeout));
        Assert.Equal(AzureRetailPricesHttpResiliencePolicy.CircuitBreakerFailureThreshold, handler.SendCount);

        foreach (string healthyName in ClientNames.Where(name => name != failingName))
        {
            using HttpClient healthy = CreateClient(services, healthyName);
            using HttpResponseMessage response = await healthy.GetAsync(CatalogPath).WaitAsync(TestTimeout);
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        failing = false;
        clock.Advance(TimeSpan.FromSeconds(AzureRetailPricesHttpResiliencePolicy.CircuitBreakerBreakDurationSeconds + 1));

        for (int call = 0; call < 2; call++)
        {
            using HttpResponseMessage response = await client.GetAsync(CatalogPath).WaitAsync(TestTimeout);
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        Assert.Equal(AzureRetailPricesHttpResiliencePolicy.CircuitBreakerFailureThreshold + 2, handler.SendCount);
    }

    [Theory]
    [InlineData(Azure)]
    [InlineData(Aws)]
    [InlineData(Gcp)]
    public async Task Saturating_one_provider_does_not_delay_others_and_cancel_releases_capacity(string saturatedName)
    {
        const int maxCalls = AzureRetailPricesHttpResiliencePolicy.MaxConcurrentPricingCalls;
        FakeTimeProvider clock = new();
        BlockingHandler blocked = new();
        ServiceCollection registrations = CreateRegistrations(clock);
        registrations.AddHttpClient(saturatedName).ConfigurePrimaryHttpMessageHandler(() => blocked);

        foreach (string otherName in ClientNames.Where(name => name != saturatedName))
        {
            registrations.AddHttpClient(otherName).ConfigurePrimaryHttpMessageHandler(
                static () => new RecordingHandler(_ => new HttpResponseMessage(HttpStatusCode.OK)));
        }

        await using ServiceProvider services = registrations.BuildServiceProvider();
        using HttpClient saturated = CreateClient(services, saturatedName);
        using CancellationTokenSource cts = new();
        Task<HttpResponseMessage> cancelable = saturated.GetAsync(CatalogPath, cts.Token);
        List<Task<HttpResponseMessage>> inFlight = Enumerable.Range(0, maxCalls - 1)
            .Select(_ => saturated.GetAsync(CatalogPath)).ToList();

        try
        {
            Assert.Equal(maxCalls, blocked.SendCount);

            for (int rejected = 0; rejected < 6; rejected++)
            {
                using HttpResponseMessage overflow = await saturated.GetAsync(CatalogPath).WaitAsync(TestTimeout);
                Assert.Equal(HttpStatusCode.ServiceUnavailable, overflow.StatusCode);
                Assert.Equal("Local pricing client concurrency limit reached", overflow.ReasonPhrase);
            }

            Assert.Equal(maxCalls, blocked.SendCount);
            Assert.All(inFlight, static request => Assert.False(request.IsCompleted));

            foreach (string otherName in ClientNames.Where(name => name != saturatedName))
            {
                using HttpClient healthy = CreateClient(services, otherName);
                using HttpResponseMessage response = await healthy.GetAsync(CatalogPath).WaitAsync(TestTimeout);
                Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            }

            await cts.CancelAsync();
            await Assert.ThrowsAnyAsync<OperationCanceledException>(() => cancelable.WaitAsync(TestTimeout));
            inFlight.Add(saturated.GetAsync(CatalogPath));
            Assert.Equal(maxCalls + 1, blocked.SendCount);

            blocked.Complete();
            await Task.WhenAll(inFlight).WaitAsync(TestTimeout);
            using HttpResponseMessage recovered = await saturated.GetAsync(CatalogPath).WaitAsync(TestTimeout);
            Assert.Equal(HttpStatusCode.OK, recovered.StatusCode);
        }
        finally
        {
            blocked.Complete();

            foreach (Task<HttpResponseMessage> pending in inFlight)
            {
                (await pending.WaitAsync(TestTimeout)).Dispose();
            }

            if (!cts.IsCancellationRequested)
            {
                (await cancelable.WaitAsync(TestTimeout)).Dispose();
            }
        }
    }

    private static HttpResponseMessage Throttle(TimeSpan delay) =>
        new(HttpStatusCode.TooManyRequests) { Headers = { RetryAfter = new RetryConditionHeaderValue(delay) } };

    private static ServiceCollection CreateRegistrations(TimeProvider clock)
    {
        ServiceCollection services = [];
        services.AddSingleton(clock);
        services.RegisterAzureArmAndRetailPricesHttpClients();
        services.RegisterMultiCloudPublicPricingHttpClients();
        return services;
    }

    private static ServiceProvider CreateServices(TimeProvider clock, string clientName, RecordingHandler handler)
    {
        ServiceCollection services = CreateRegistrations(clock);
        services.AddHttpClient(clientName).ConfigurePrimaryHttpMessageHandler(() => handler);
        return services.BuildServiceProvider();
    }

    private static HttpClient CreateClient(ServiceProvider services, string clientName) =>
        services.GetRequiredService<IHttpClientFactory>().CreateClient(clientName);

    private sealed class RecordingHandler(Func<HttpRequestMessage, HttpResponseMessage> respond, bool repeatResponse = false) : HttpMessageHandler
    {
        private int _sendCount;

        public int SendCount => Volatile.Read(ref _sendCount);

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            int sendCount = Interlocked.Increment(ref _sendCount);
            return Task.FromResult(sendCount == 1 || repeatResponse ? respond(request) : new HttpResponseMessage(HttpStatusCode.OK));
        }
    }

    private sealed class BlockingHandler : HttpMessageHandler
    {
        private readonly TaskCompletionSource _complete = new(TaskCreationOptions.RunContinuationsAsynchronously);
        private int _sendCount;

        public int SendCount => Volatile.Read(ref _sendCount);

        public void Complete() => _complete.TrySetResult();

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Interlocked.Increment(ref _sendCount);
            await _complete.Task.WaitAsync(cancellationToken);
            return new HttpResponseMessage(HttpStatusCode.OK);
        }
    }

    private sealed class ObservedClock : TimeProvider
    {
        private readonly FakeTimeProvider _clock = new();
        private readonly Channel<TimeSpan> _timers = Channel.CreateUnbounded<TimeSpan>();

        public override long TimestampFrequency => _clock.TimestampFrequency;

        public override long GetTimestamp() => _clock.GetTimestamp();

        public override DateTimeOffset GetUtcNow() => _clock.GetUtcNow();

        public override ITimer CreateTimer(TimerCallback callback, object? state, TimeSpan dueTime, TimeSpan period)
        {
            ITimer timer = _clock.CreateTimer(callback, state, dueTime, period);
            _timers.Writer.TryWrite(dueTime);
            return timer;
        }

        public Task<TimeSpan> NextTimerAsync() => _timers.Reader.ReadAsync().AsTask();

        public void Advance(TimeSpan delay) => _clock.Advance(delay);
    }
}
