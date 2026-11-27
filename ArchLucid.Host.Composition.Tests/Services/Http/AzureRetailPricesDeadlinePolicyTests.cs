using System.Globalization;
using System.Net;
using System.Net.Http.Headers;

using ArchLucid.Core.Http;
using ArchLucid.Host.Composition.Startup;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Time.Testing;

namespace ArchLucid.Host.Composition.Tests.Services.Http;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AzureRetailPricesDeadlinePolicyTests
{
    private const string CatalogPath = "api/retail/prices";
    private static readonly TimeSpan TestTimeout = TimeSpan.FromSeconds(5);

    [Theory]
    [InlineData(HttpStatusCode.TooManyRequests, false)]
    [InlineData(HttpStatusCode.ServiceUnavailable, true)]
    public async Task Retail_prices_waits_for_retry_after(HttpStatusCode statusCode, bool useHttpDate)
    {
        FakeTimeProvider clock = new();
        TimeSpan delay = TimeSpan.FromSeconds(5);
        using HttpResponseMessage transient = new(statusCode);
        transient.Headers.RetryAfter = useHttpDate
            ? new RetryConditionHeaderValue(clock.GetUtcNow() + delay)
            : new RetryConditionHeaderValue(delay);

        RecordingHandler handler = new(_ => transient);
        await using ServiceProvider services = CreateServices(clock, handler);
        using HttpClient client = CreateClient(services);

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
    [InlineData(2)]
    [InlineData(3)]
    public async Task Retail_prices_returns_original_response_if_retry_reaches_or_exceeds_deadline(int retryAfterSeconds)
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
        await using ServiceProvider services = CreateServices(clock, handler);
        using HttpClient client = CreateClient(services);

        HttpResponseMessage result = await client.GetAsync(CatalogPath).WaitAsync(TestTimeout);

        Assert.Same(transient, result);
        Assert.Equal(TimeSpan.FromSeconds(retryAfterSeconds), result.Headers.RetryAfter?.Delta);
        Assert.Equal("catalog is throttled", await result.Content.ReadAsStringAsync());
        Assert.Equal(1, handler.SendCount);
    }

    [Fact]
    public async Task Retail_prices_cancels_retry_after_wait_without_sending_again()
    {
        FakeTimeProvider clock = new();
        using HttpResponseMessage transient = new(HttpStatusCode.ServiceUnavailable);
        transient.Headers.RetryAfter = new RetryConditionHeaderValue(TimeSpan.FromSeconds(10));
        RecordingHandler handler = new(_ => transient);
        await using ServiceProvider services = CreateServices(clock, handler);
        using HttpClient client = CreateClient(services);
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
    public async Task Retail_prices_uses_standard_backoff_when_header_does_not_extend_delay(string? header)
    {
        FakeTimeProvider clock = new();
        using HttpResponseMessage transient = new(HttpStatusCode.ServiceUnavailable);
        if (header is not null)
        {
            transient.Headers.TryAddWithoutValidation(
                "Retry-After",
                header == "past-date" ? clock.GetUtcNow().AddMinutes(-1).ToString("R", CultureInfo.InvariantCulture) : header);
        }

        RecordingHandler handler = new(_ => transient);
        await using ServiceProvider services = CreateServices(clock, handler);
        using HttpClient client = CreateClient(services);

        Task<HttpResponseMessage> pending = client.GetAsync(CatalogPath);
        clock.Advance(TimeSpan.FromMilliseconds(999));
        Assert.False(pending.IsCompleted);
        Assert.Equal(1, handler.SendCount);

        clock.Advance(TimeSpan.FromMilliseconds(1));
        using HttpResponseMessage result = await pending.WaitAsync(TestTimeout);
        Assert.Equal(HttpStatusCode.OK, result.StatusCode);
        Assert.Equal(2, handler.SendCount);
    }

    [Theory]
    [InlineData("POST", false)]
    [InlineData("POST", true)]
    [InlineData("GET", true)]
    public async Task Retail_prices_does_not_retry_writes_or_requests_with_content(string method, bool hasContent)
    {
        FakeTimeProvider clock = new();
        using HttpResponseMessage transient = new(HttpStatusCode.TooManyRequests);
        transient.Headers.RetryAfter = new RetryConditionHeaderValue(TimeSpan.FromSeconds(10));
        RecordingHandler handler = new(_ => transient);
        await using ServiceProvider services = CreateServices(clock, handler);
        using HttpClient client = CreateClient(services);
        using HttpRequestMessage request = new(new HttpMethod(method), CatalogPath);
        if (hasContent)
        {
            request.Content = new StringContent("request payload");
        }

        HttpResponseMessage result = await client.SendAsync(request).WaitAsync(TestTimeout);

        Assert.Same(transient, result);
        Assert.Equal(1, handler.SendCount);
    }

    private static ServiceProvider CreateServices(FakeTimeProvider clock, RecordingHandler handler)
    {
        ServiceCollection services = [];
        services.AddSingleton<TimeProvider>(clock);
        services.RegisterAzureArmAndRetailPricesHttpClients();
        services.AddHttpClient(ArchLucidAzurePublicHttpClients.RetailPricesHttpClientName)
            .ConfigurePrimaryHttpMessageHandler(() => handler);
        return services.BuildServiceProvider();
    }

    private static HttpClient CreateClient(ServiceProvider services) =>
        services.GetRequiredService<IHttpClientFactory>().CreateClient(ArchLucidAzurePublicHttpClients.RetailPricesHttpClientName);

    private sealed class RecordingHandler(Func<HttpRequestMessage, HttpResponseMessage> first) : HttpMessageHandler
    {
        private int _sendCount;

        public int SendCount => Volatile.Read(ref _sendCount);

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) =>
            Task.FromResult(Interlocked.Increment(ref _sendCount) == 1 ? first(request) : new HttpResponseMessage(HttpStatusCode.OK));
    }
}
