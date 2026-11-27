using System.Net;
using System.Net.Http.Headers;
using System.Threading.Channels;

using ArchLucid.Application.Integrations.Itsm.OAuth;
using ArchLucid.Core.Http;
using ArchLucid.Host.Composition.Startup.Modules;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Http;
using ArchLucid.Host.Core.Hosting;
using ArchLucid.Host.Core.Services.Delivery;
using ArchLucid.Integrations.AzureDevOps;
using ArchLucid.Notifications;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Time.Testing;

namespace ArchLucid.Host.Composition.Tests.Services.Http;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class Fnd065ExternalOutboundTests
{
    private static readonly TimeSpan TestTimeout = TimeSpan.FromSeconds(5);
    private static readonly Uri Target = new("https://synthetic.invalid/resource");

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Eligible_reads_honor_retry_after_and_unprotected_posts_send_once(bool dateHeader)
    {
        RetryClock clock = new();
        using ServiceProvider provider = CreateExternalClients(clock, Transport(
            (_, attempt, _) =>
            {
                if (attempt == 3)
                    return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK));

                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.ServiceUnavailable)
                {
                    Headers =
                    {
                        RetryAfter = dateHeader
                            ? new RetryConditionHeaderValue(clock.GetUtcNow() + TimeSpan.FromSeconds(3))
                            : new RetryConditionHeaderValue(TimeSpan.FromSeconds(3))
                    }
                });
            }), Transport((_, _, _) => Result(HttpStatusCode.OK)));
        using HttpClient client = provider.GetRequiredService<IHttpClientFactory>().CreateClient("first");
        using HttpResponseMessage post = await client.PostAsync(Target, content: null).WaitAsync(TestTimeout);
        Assert.Equal(HttpStatusCode.ServiceUnavailable, post.StatusCode);

        Task<HttpResponseMessage> pending = client.GetAsync(Target);
        Assert.Equal(TimeSpan.FromSeconds(3), await clock.Delays.Reader.ReadAsync().AsTask().WaitAsync(TestTimeout));
        clock.Advance(TimeSpan.FromSeconds(2));
        Assert.False(pending.IsCompleted);
        clock.Advance(TimeSpan.FromSeconds(1));

        using HttpResponseMessage read = await pending.WaitAsync(TestTimeout);
        Assert.Equal(HttpStatusCode.OK, read.StatusCode);
    }

    [Fact]
    public async Task A_server_wait_beyond_the_budget_returns_the_last_response()
    {
        RetryClock clock = new();
        RecordingTransport transport = Transport((_, _, _) =>
        {
            clock.Advance(TimeSpan.FromSeconds(28));

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.TooManyRequests)
            {
                Headers = { RetryAfter = new RetryConditionHeaderValue(TimeSpan.FromSeconds(3)) }
            });
        });
        using ServiceProvider provider = CreateExternalClients(clock, transport,
            Transport((_, _, _) => Result(HttpStatusCode.OK)));
        using HttpClient client = provider.GetRequiredService<IHttpClientFactory>().CreateClient("first");

        using HttpResponseMessage response = await client.GetAsync(Target).WaitAsync(TestTimeout);
        Assert.Equal(HttpStatusCode.TooManyRequests, response.StatusCode);
        Assert.Equal(1, transport.Count);
        Assert.False(clock.Delays.Reader.TryRead(out _));
    }

    [Fact]
    public async Task Saturating_one_client_does_not_queue_replay_or_block_another_client()
    {
        TaskCompletionSource release = new(TaskCreationOptions.RunContinuationsAsynchronously);
        RecordingTransport congested = Transport(async (_, _, token) =>
        {
            await release.Task.WaitAsync(token);

            return new HttpResponseMessage(HttpStatusCode.OK);
        });
        RecordingTransport independent = Transport((_, _, _) => Result(HttpStatusCode.OK));
        using ServiceProvider provider = CreateExternalClients(new FakeTimeProvider(), congested, independent);
        IHttpClientFactory factory = provider.GetRequiredService<IHttpClientFactory>();
        using HttpClient first = factory.CreateClient("first");
        using HttpClient second = factory.CreateClient("second");
        using CancellationTokenSource caller = new();
        Task<HttpResponseMessage> canceled = first.GetAsync(Target, caller.Token);
        Task<HttpResponseMessage>[] held = Enumerable.Range(0, 19).Select(_ => first.GetAsync(Target)).ToArray();

        try
        {
            Assert.Equal(20, congested.Count);
            using HttpResponseMessage shed = await first.GetAsync(Target).WaitAsync(TestTimeout);
            Assert.Equal(HttpStatusCode.ServiceUnavailable, shed.StatusCode);
            Assert.Equal(20, congested.Count);
            using HttpResponseMessage healthy = await second.GetAsync(Target).WaitAsync(TestTimeout);
            Assert.Equal(HttpStatusCode.OK, healthy.StatusCode);
            await caller.CancelAsync();
            await Assert.ThrowsAnyAsync<OperationCanceledException>(() => canceled.WaitAsync(TestTimeout));
        }
        finally
        {
            release.TrySetResult();
        }

        foreach (HttpResponseMessage response in await Task.WhenAll(held).WaitAsync(TestTimeout))
            response.Dispose();

        using HttpResponseMessage recovered = await first.GetAsync(Target).WaitAsync(TestTimeout);
        Assert.Equal(HttpStatusCode.OK, recovered.StatusCode);
        Assert.Equal(21, congested.Count);
        Assert.Equal(1, independent.Count);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task A_webhook_post_does_not_retry_when_delivery_is_uncertain(bool transportFailure)
    {
        RecordingTransport transport = Transport((_, _, _) => transportFailure
            ? Task.FromException<HttpResponseMessage>(new HttpRequestException("Synthetic lost response."))
            : Result(HttpStatusCode.ServiceUnavailable));
        using ServiceProvider provider = CreateWebhookClients(transport);
        IWebhookPoster poster = provider.GetRequiredService<IWebhookPoster>();

        await Assert.ThrowsAsync<HttpRequestException>(() =>
            poster.PostJsonAsync(Target.ToString(), new { Message = "synthetic" }, CancellationToken.None));

        Assert.Equal(1, transport.Count);
    }

    [Fact]
    public async Task Service_bus_redelivery_does_not_repost_an_ambiguous_event_to_the_same_destination()
    {
        RecordingTransport transport = Transport((_, count, _) => count == 1
            ? Task.FromException<HttpResponseMessage>(new HttpRequestException("Synthetic lost response."))
            : Result(HttpStatusCode.OK));
        using ServiceProvider provider = CreateWebhookClients(transport);
        AuthorityRunCompletedChatOpsIntegrationEventHandler handler =
            new(provider.GetRequiredService<IAuthorityRunCommittedChatOpsHook>());
        Guid tenant = Guid.NewGuid();
        Guid run = Guid.NewGuid();
        Guid manifest = Guid.NewGuid();

        byte[] Encode(Guid eventId) => System.Text.Json.JsonSerializer.SerializeToUtf8Bytes(
            new { SchemaVersion = 1, RunId = run, TenantId = tenant, ManifestId = eventId });

        byte[] delivery = Encode(manifest);
        await Assert.ThrowsAsync<InvalidOperationException>(() => handler.HandleAsync(delivery, CancellationToken.None));
        await handler.HandleAsync(delivery, CancellationToken.None);
        Assert.Equal(1, transport.Count);
        await handler.HandleAsync(Encode(Guid.NewGuid()), CancellationToken.None);
        Assert.Equal(2, transport.Count);
    }

    [Theory]
    [InlineData(AzureDevOpsCommitStatusPublisher.HttpClientName)]
    [InlineData(AzureDevOpsPullRequestDecorator.HttpClientName)]
    [InlineData(nameof(IItsmConnectorOAuthTokenExchanger))]
    public async Task Production_status_and_oauth_clients_do_not_replay_a_post(string clientName)
    {
        ServiceCollection services = [];
        services.AddLogging();
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(
            new Dictionary<string, string?> { ["ArchLucid:StorageProvider"] = "InMemory" }).Build();
        services.Configure<OutboundExternalHttpResilienceOptions>(options => options.MaxRetryAttempts = 3);
        OutboxProcessorsCompositionRegistrar.RegisterAzureDevOpsCommitStatusPublisher(services, configuration);
        OutboxProcessorsCompositionRegistrar.RegisterIntegrationEventConsumer(services, configuration, ArchLucidHostingRole.Worker);
        ArchLucid.Host.Composition.Startup.ServiceCollectionExtensions.RegisterIntegrationsOutboundHttpClients(services);
        RecordingTransport transport = Transport((_, _, _) => Result(HttpStatusCode.ServiceUnavailable));
        services.AddHttpClient(clientName).ConfigurePrimaryHttpMessageHandler(() => transport);
        using ServiceProvider provider = services.BuildServiceProvider();
        using HttpClient client = provider.GetRequiredService<IHttpClientFactory>().CreateClient(clientName);
        using StringContent body = new("{}");

        using HttpResponseMessage result = await client.PostAsync(Target, body).WaitAsync(TestTimeout);

        Assert.Equal(HttpStatusCode.ServiceUnavailable, result.StatusCode);
        Assert.Equal(1, transport.Count);
    }

    private static ServiceProvider CreateExternalClients(TimeProvider clock, RecordingTransport first, RecordingTransport second)
    {
        ServiceCollection services = [];
        services.AddLogging();
        services.AddSingleton(clock);
        services.Configure<OutboundExternalHttpResilienceOptions>(options =>
        {
            options.MaxRetryAttempts = 1;
            options.MinimumThroughput = 20;
        });
        Register("first", first);
        Register("second", second);

        return services.BuildServiceProvider();

        void Register(string name, RecordingTransport transport)
        {
            services.AddHttpClient(name, c => c.Timeout = TimeSpan.FromSeconds(30))
                .ConfigurePrimaryHttpMessageHandler(() => transport)
                .AddOutboundExternalHttpResilienceForReadRetries();
        }
    }

    private static ServiceProvider CreateWebhookClients(RecordingTransport transport)
    {
        ServiceCollection services = [];
        services.AddLogging();
        services.Configure<OutboundExternalHttpResilienceOptions>(options => options.MaxRetryAttempts = 3);
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(
            new Dictionary<string, string?> { ["ArchLucid:StorageProvider"] = "InMemory" }).Build();
        AdvisoryDigestSchedulingRegistrar.RegisterDigestDelivery(services, configuration);
        services.PostConfigure<WebhookDeliveryOptions>(options =>
        {
            options.UseHttpClient = true;
            options.HmacSha256SharedSecret = "synthetic-test-value";
        });
        services.PostConfigure<ChatOpsIncomingWebhooksOptions>(options =>
        {
            options.SlackNotifyOnAuthorityRunCompleted = true;
            options.SlackIncomingWebhookAbsoluteUri = Target.ToString();
        });
        services.AddHttpClient(HttpWebhookPoster.WebhookHttpClientName)
            .ConfigurePrimaryHttpMessageHandler(() => transport);

        return services.BuildServiceProvider();
    }

    private static RecordingTransport Transport(
        Func<HttpRequestMessage, int, CancellationToken, Task<HttpResponseMessage>> send) => new(send);

    private static Task<HttpResponseMessage> Result(HttpStatusCode status) => Task.FromResult(new HttpResponseMessage(status));

    private sealed class RecordingTransport(
        Func<HttpRequestMessage, int, CancellationToken, Task<HttpResponseMessage>> send) : HttpMessageHandler
    {
        private int _count;
        public int Count => Volatile.Read(ref _count);

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Assert.Equal(Target.Host, request.RequestUri?.Host);

            return send(request, Interlocked.Increment(ref _count), cancellationToken);
        }
    }

    private sealed class RetryClock : TimeProvider
    {
        private readonly FakeTimeProvider _clock = new();

        public override long TimestampFrequency => _clock.TimestampFrequency;
        public override long GetTimestamp() => _clock.GetTimestamp();
        public override DateTimeOffset GetUtcNow() => _clock.GetUtcNow();
        public void Advance(TimeSpan time) => _clock.Advance(time);
        public Channel<TimeSpan> Delays { get; } = Channel.CreateUnbounded<TimeSpan>();

        public override ITimer CreateTimer(TimerCallback callback, object? state, TimeSpan dueTime, TimeSpan period)
        {
            ITimer timer = _clock.CreateTimer(callback, state, dueTime, period);
            Delays.Writer.TryWrite(dueTime);

            return timer;
        }
    }
}
