using System.Net;
using System.Net.Http.Headers;
using System.Threading.Channels;

using ArchLucid.Core.Http;
using ArchLucid.Host.Composition.Startup;
using ArchLucid.Host.Composition.Startup.Modules;
using ArchLucid.Integrations.AzureExtractor;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Time.Testing;

namespace ArchLucid.Host.Composition.Tests.Services.Http;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AzureArmReadDeadlinePolicyTests
{
    private const string NamedArm = ArchLucidAzurePublicHttpClients.ResourceManagerHttpClientName;
    private const string HostedArm = nameof(IHostedAzureArmReadClient);
    private const string HostedPostRead = nameof(IHostedAzureManagementPostReadClient);
    private static readonly Uri ArmUri = new("https://management.azure.com/subscriptions");
    private static readonly TimeSpan TestTimeout = TimeSpan.FromSeconds(5);

    [Theory]
    [InlineData(NamedArm)]
    [InlineData(HostedArm)]
    public async Task Arm_throttle_returns_the_original_response_when_retry_after_cannot_fit(string name)
    {
        RetryClock clock = new();
        using HttpResponseMessage throttled = new(HttpStatusCode.TooManyRequests)
        {
            Content = new StringContent("ARM throttle"),
            Headers = { RetryAfter = new RetryConditionHeaderValue(TimeSpan.FromSeconds(2)) },
        };
        RecordingTransport arm = new(index =>
        {
            if (index != 1)
                return new HttpResponseMessage(HttpStatusCode.OK);

            clock.Advance(TimeSpan.FromMinutes(5) - TimeSpan.FromSeconds(2));

            return throttled;
        });
        await using ServiceProvider services = BuildServices(clock, name, arm);
        using HttpClient client = Client(services, name);

        using HttpResponseMessage result = await client.GetAsync(ArmUri).WaitAsync(TestTimeout);

        Assert.Equal(TimeSpan.FromMinutes(5), client.Timeout);
        Assert.Same(throttled, result);
        Assert.Equal("ARM throttle", await result.Content.ReadAsStringAsync());
        Assert.Equal(TimeSpan.FromSeconds(2), result.Headers.RetryAfter?.Delta);
        Assert.Equal(1, arm.Sends);
    }

    [Theory]
    [InlineData(NamedArm, false)]
    [InlineData(NamedArm, true)]
    [InlineData(HostedArm, false)]
    [InlineData(HostedArm, true)]
    public async Task Arm_honors_the_server_delay_without_holding_up_pricing(string name, bool dateHeader)
    {
        RetryClock clock = new();
        TimeSpan delay = TimeSpan.FromSeconds(6);
        RecordingTransport arm = new(index => index == 1
            ? new HttpResponseMessage(dateHeader ? HttpStatusCode.ServiceUnavailable : HttpStatusCode.TooManyRequests)
            {
                Headers =
                {
                    RetryAfter = dateHeader
                        ? new RetryConditionHeaderValue(clock.GetUtcNow() + delay)
                        : new RetryConditionHeaderValue(delay),
                },
            }
            : new HttpResponseMessage(HttpStatusCode.OK));
        RecordingTransport pricing = new(_ => new HttpResponseMessage(HttpStatusCode.OK));
        await using ServiceProvider services = BuildServices(clock, name, arm, pricing);
        using HttpClient armClient = Client(services, name);
        using HttpClient pricingClient = Client(services, ArchLucidMultiCloudPublicHttpClients.AwsPricingHttpClientName);

        Task<HttpResponseMessage> pending = armClient.GetAsync(ArmUri);
        Assert.Equal(delay, await clock.NextTimerAsync().WaitAsync(TestTimeout));
        clock.Advance(delay - TimeSpan.FromSeconds(1));

        using HttpResponseMessage other = await pricingClient.GetAsync("catalog").WaitAsync(TestTimeout);
        Assert.Equal(HttpStatusCode.OK, other.StatusCode);
        Assert.Equal(1, pricing.Sends);
        Assert.Equal(1, arm.Sends);
        Assert.False(pending.IsCompleted);

        clock.Advance(TimeSpan.FromSeconds(1));
        using HttpResponseMessage result = await pending.WaitAsync(TestTimeout);
        Assert.Equal(HttpStatusCode.OK, result.StatusCode);
        Assert.Equal(2, arm.Sends);
    }

    [Fact]
    public async Task Arm_retries_have_bounded_jitter_and_stop_after_four_total_attempts()
    {
        RetryClock clock = new();
        RecordingTransport arm = new(_ => new HttpResponseMessage(HttpStatusCode.ServiceUnavailable));
        await using ServiceProvider services = BuildServices(clock, NamedArm, arm);
        using HttpClient client = Client(services, NamedArm);
        Task<HttpResponseMessage> pending = client.GetAsync(ArmUri);

        for (int attempt = 0; attempt < 3; attempt++)
        {
            TimeSpan baseline = TimeSpan.FromSeconds(1 << attempt);
            TimeSpan delay = await clock.NextTimerAsync().WaitAsync(TestTimeout);

            Assert.InRange(delay, baseline, baseline * 1.25);
            Assert.Equal(attempt + 1, arm.Sends);
            clock.Advance(delay);
        }

        using HttpResponseMessage result = await pending.WaitAsync(TestTimeout);
        Assert.Equal(HttpStatusCode.ServiceUnavailable, result.StatusCode);
        Assert.Equal(4, arm.Sends);
    }

    [Fact]
    public async Task Hosted_extractor_arm_reader_preserves_cancellation_during_retry_wait()
    {
        RetryClock clock = new();
        RecordingTransport arm = new(_ => new HttpResponseMessage(HttpStatusCode.TooManyRequests)
        {
            Headers = { RetryAfter = new RetryConditionHeaderValue(TimeSpan.FromSeconds(15)) },
        });
        await using ServiceProvider services = BuildServices(clock, HostedArm, arm);
        IHostedAzureArmReadClient client = services.GetRequiredService<IHostedAzureArmReadClient>();
        using CancellationTokenSource cancellation = new();

        Task<IReadOnlyList<HostedAzureArmResourceRecord>> pending =
            client.ListSubscriptionResourcesAsync("synthetic-token", Guid.NewGuid().ToString("D"), cancellation.Token);
        Assert.Equal(TimeSpan.FromSeconds(15), await clock.NextTimerAsync().WaitAsync(TestTimeout));
        await cancellation.CancelAsync();

        await Assert.ThrowsAnyAsync<OperationCanceledException>(() => pending.WaitAsync(TestTimeout));
        clock.Advance(TimeSpan.FromSeconds(15));
        Assert.Equal(1, arm.Sends);
    }

    [Theory]
    [InlineData(NamedArm)]
    [InlineData(HostedPostRead)]
    public async Task Arm_unverified_post_requests_do_not_enter_retry_policy(string name)
    {
        RetryClock clock = new();
        RecordingTransport arm = new(index => index == 1
            ? new HttpResponseMessage(HttpStatusCode.TooManyRequests)
            {
                Headers = { RetryAfter = new RetryConditionHeaderValue(TimeSpan.FromMinutes(5)) },
            }
            : new HttpResponseMessage(HttpStatusCode.OK));
        await using ServiceProvider services = BuildServices(clock, name, arm);
        using HttpClient client = Client(services, name);

        using StringContent body = new("{}");

        using HttpResponseMessage result = await client.PostAsync(ArmUri, body).WaitAsync(TestTimeout);

        Assert.Equal(HttpStatusCode.TooManyRequests, result.StatusCode);
        Assert.Equal(1, arm.Sends);
    }

    [Theory]
    [InlineData("Microsoft.CostManagement/query", true)]
    [InlineData("Microsoft.PolicyInsights/policyStates/latest/queryResults", true)]
    [InlineData("Microsoft.ContainerService/managedClusters/test/runCommand", false)]
    [InlineData("Microsoft.Network/networkInterfaces/test/effectiveRouteTable", false)]
    public async Task Hosted_management_client_retries_only_verified_query_posts(string operation, bool retry)
    {
        RetryClock clock = new();
        RecordingTransport arm = new(index => index == 1
            ? new HttpResponseMessage(HttpStatusCode.ServiceUnavailable)
            {
                Headers = { RetryAfter = new RetryConditionHeaderValue(TimeSpan.FromSeconds(7)) },
            }
            : new HttpResponseMessage(HttpStatusCode.OK));
        await using ServiceProvider services = BuildServices(clock, HostedPostRead, arm);
        using HttpClient client = Client(services, HostedPostRead);
        using StringContent body = new("{}");
        string url = $"https://management.azure.com/subscriptions/{Guid.NewGuid():D}/providers/{operation}";

        Task<HttpResponseMessage> result = client.PostAsync(new Uri(url), body);

        if (retry)
        {
            Assert.Equal(TimeSpan.FromSeconds(7), await clock.NextTimerAsync().WaitAsync(TestTimeout));
            clock.Advance(TimeSpan.FromSeconds(7));
        }

        using HttpResponseMessage response = await result.WaitAsync(TestTimeout);
        Assert.Equal(retry ? HttpStatusCode.OK : HttpStatusCode.ServiceUnavailable, response.StatusCode);
        Assert.Equal(retry ? 2 : 1, arm.Sends);
    }

    private static ServiceProvider BuildServices(
        TimeProvider clock, string armName, RecordingTransport arm, RecordingTransport? pricing = null)
    {
        ServiceCollection registrations = [];
        registrations.AddSingleton(clock);
        registrations.RegisterAzureArmAndRetailPricesHttpClients();
        registrations.RegisterMultiCloudPublicPricingHttpClients();
        HostedCloudExtractorCompositionModule.RegisterAzure(registrations, new ConfigurationBuilder().Build());
        registrations.AddHttpClient(armName).ConfigurePrimaryHttpMessageHandler(() => arm);

        if (pricing is not null)
        {
            registrations.AddHttpClient(ArchLucidMultiCloudPublicHttpClients.AwsPricingHttpClientName)
                .ConfigurePrimaryHttpMessageHandler(() => pricing);
        }

        return registrations.BuildServiceProvider();
    }

    private static HttpClient Client(ServiceProvider services, string name) =>
        services.GetRequiredService<IHttpClientFactory>().CreateClient(name);

    private sealed class RecordingTransport(Func<int, HttpResponseMessage> reply) : HttpMessageHandler
    {
        private int _sends;
        public int Sends => Volatile.Read(ref _sends);

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            cancellationToken.ThrowIfCancellationRequested();

            return Task.FromResult(reply(Interlocked.Increment(ref _sends)));
        }
    }

    private sealed class RetryClock : TimeProvider
    {
        private readonly FakeTimeProvider _clock = new();
        private readonly Channel<TimeSpan> _scheduled = Channel.CreateUnbounded<TimeSpan>();

        public override long TimestampFrequency => _clock.TimestampFrequency;
        public override long GetTimestamp() => _clock.GetTimestamp();
        public override DateTimeOffset GetUtcNow() => _clock.GetUtcNow();

        public override ITimer CreateTimer(TimerCallback callback, object? state, TimeSpan dueTime, TimeSpan period)
        {
            ITimer timer = _clock.CreateTimer(callback, state, dueTime, period);
            _scheduled.Writer.TryWrite(dueTime);

            return timer;
        }

        public Task<TimeSpan> NextTimerAsync() => _scheduled.Reader.ReadAsync().AsTask();
        public void Advance(TimeSpan duration) => _clock.Advance(duration);
    }
}
