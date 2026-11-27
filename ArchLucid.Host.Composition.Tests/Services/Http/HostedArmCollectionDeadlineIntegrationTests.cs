using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Threading.Channels;

using ArchLucid.Application.AzureExtractor;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Host.Composition.Startup.Modules;
using ArchLucid.Integrations.AzureExtractor;

using Azure.Core;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Time.Testing;

using Moq;

namespace ArchLucid.Host.Composition.Tests.Services.Http;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class HostedArmCollectionDeadlineIntegrationTests
{
    private const string HostedArm = nameof(IHostedAzureArmReadClient);
    private const string SyntheticToken = "synthetic-arm-test-token";
    private static readonly TimeSpan CallBudget = TimeSpan.FromSeconds(60);
    private static readonly TimeSpan FirstPageElapsed = TimeSpan.FromSeconds(40);
    private static readonly TimeSpan RetryAfter = TimeSpan.FromSeconds(25);
    private static readonly TimeSpan TestTimeout = TimeSpan.FromSeconds(5);

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Collection_deadline_interrupts_a_later_pages_retry_wait_without_ingest(bool useHttpDate)
    {
        TestClock clock = new();
        Guid tenantId = Guid.NewGuid();
        string subscriptionId = Guid.NewGuid().ToString("D");
        using PagedArmTransport arm = new(clock, subscriptionId, useHttpDate);
        Mock<IAzureExtractorIngestService> ingest = new(MockBehavior.Strict);
        await using ServiceProvider provider = BuildServices(clock, tenantId, subscriptionId, arm, ingest);
        await using AsyncServiceScope scope = provider.CreateAsyncScope();
        IHostedAzureExtractorRunService service = scope.ServiceProvider.GetRequiredService<IHostedAzureExtractorRunService>();

        Task<HostedAzureExtractorRunResult> pending = service.RunAsync(
            tenantId, subscriptionId, null, "synthetic-operator", null, CancellationToken.None);

        Assert.Equal(CallBudget, await clock.NextTimerAsync().WaitAsync(TestTimeout));
        Assert.Equal(RetryAfter, await clock.NextTimerAsync().WaitAsync(TestTimeout));
        Assert.Equal(2, arm.Sends);

        clock.Advance(CallBudget - FirstPageElapsed - TimeSpan.FromSeconds(1));
        Assert.False(pending.IsCompleted);
        Assert.Equal(2, arm.Sends);

        clock.Advance(TimeSpan.FromSeconds(1));
        HostedAzureExtractorRunResult result = await pending.WaitAsync(TestTimeout);

        Assert.False(result.Succeeded);
        Assert.Equal(HostedAzureExtractorRunFailureKind.CollectionFailed, result.FailureKind);
        Assert.Contains("60-second deadline", result.FailureDetail);
        Assert.Null(result.PackageId);

        // Advance beyond the would-be retry to ensure cancellation removed the pending send.
        clock.Advance(RetryAfter);
        Assert.Equal(2, arm.Sends);
        ingest.VerifyNoOtherCalls();
    }

    private static ServiceProvider BuildServices(
        TimeProvider clock, Guid tenantId, string subscriptionId, PagedArmTransport arm,
        Mock<IAzureExtractorIngestService> ingest)
    {
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(
            new Dictionary<string, string?>
            {
                ["HostedAzureExtractor:Enabled"] = "true",
                ["HostedAzureExtractor:CollectionTimeoutSeconds"] = "60",
            }).Build();
        string customerTenantId = Guid.NewGuid().ToString("D");
        string customerAppId = Guid.NewGuid().ToString("D");
        Mock<ITenantHostedExtractorConfigurationRepository> configRepository = new(MockBehavior.Strict);
        configRepository.Setup(repository => repository.TryGetAsync(
                tenantId, subscriptionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantHostedExtractorConfigurationRecord
            {
                CustomerTenantId = customerTenantId,
                CustomerAppId = customerAppId,
                SubscriptionId = subscriptionId,
            });
        Mock<IHostedAzureExtractorCredentialFactory> credentials = new(MockBehavior.Strict);
        credentials.Setup(factory => factory.CreateCredential(customerTenantId, customerAppId))
            .Returns(new LocalTokenCredential());

        ServiceCollection registrations = [];
        registrations.AddSingleton(clock);
        HostedCloudExtractorCompositionModule.RegisterAzure(registrations, configuration);
        registrations.AddSingleton(configRepository.Object);
        registrations.AddSingleton(ingest.Object);
        registrations.AddSingleton(credentials.Object);
        registrations.AddSingleton(new Mock<IHostedAzureManagementPostReadClient>(MockBehavior.Strict).Object);
        registrations.AddSingleton(new Mock<IEntraGroupMembershipGraphReader>(MockBehavior.Strict).Object);
        registrations.AddSingleton(new Mock<IEntraAddCredentialGraphReader>(MockBehavior.Strict).Object);
        registrations.AddHttpClient(HostedArm).ConfigurePrimaryHttpMessageHandler(() => arm);

        return registrations.BuildServiceProvider();
    }

    private sealed class PagedArmTransport(TestClock clock, string subscriptionId, bool useHttpDate) : HttpMessageHandler
    {
        private int _sends;
        public int Sends => Volatile.Read(ref _sends);

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            cancellationToken.ThrowIfCancellationRequested();
            Assert.Equal(HttpMethod.Get, request.Method);
            Assert.Equal(SyntheticToken, request.Headers.Authorization?.Parameter);
            Uri uri = Assert.IsType<Uri>(request.RequestUri);
            string path = $"/subscriptions/{subscriptionId}/resources";
            Assert.Equal("management.azure.com", uri.Host);
            Assert.Equal(path, uri.AbsolutePath);

            int send = Interlocked.Increment(ref _sends);

            if (send == 1)
            {
                Assert.DoesNotContain("page=2", uri.Query);
                clock.Advance(FirstPageElapsed);

                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = JsonContent.Create(new
                    {
                        value = new[]
                        {
                            new
                            {
                                id = $"/subscriptions/{subscriptionId}/resourceGroups/test/providers/Microsoft.Storage/storageAccounts/example",
                                name = "example",
                                type = "Microsoft.Storage/storageAccounts",
                                location = "eastus",
                            },
                        },
                        nextLink = $"https://management.azure.com{path}?api-version=2021-04-01&page=2",
                    }),
                });
            }

            Assert.Equal(2, send);
            Assert.Contains("page=2", uri.Query);

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.TooManyRequests)
            {
                Headers =
                {
                    RetryAfter = useHttpDate
                        ? new RetryConditionHeaderValue(clock.GetUtcNow() + RetryAfter)
                        : new RetryConditionHeaderValue(RetryAfter),
                },
            });
        }
    }

    private sealed class LocalTokenCredential : TokenCredential
    {
        public override AccessToken GetToken(TokenRequestContext requestContext, CancellationToken cancellationToken)
        {
            cancellationToken.ThrowIfCancellationRequested();

            return new AccessToken(SyntheticToken, DateTimeOffset.MaxValue);
        }

        public override ValueTask<AccessToken> GetTokenAsync(
            TokenRequestContext requestContext, CancellationToken cancellationToken) =>
            ValueTask.FromResult(GetToken(requestContext, cancellationToken));
    }

    private sealed class TestClock : TimeProvider
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

        public void Advance(TimeSpan duration) => _clock.Advance(duration);
    }
}
