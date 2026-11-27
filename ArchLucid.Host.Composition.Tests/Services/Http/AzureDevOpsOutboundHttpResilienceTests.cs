using System.Net;

using ArchLucid.Contracts.Abstractions.Integrations;
using ArchLucid.Core.Http;
using ArchLucid.Core.Integration;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Composition.Startup.Modules;
using ArchLucid.Host.Core.Hosting;
using ArchLucid.Host.Core.Http;
using ArchLucid.Host.Core.Integration;
using ArchLucid.Integrations.AzureDevOps;
using ArchLucid.Persistence.IntegrationOutbox;

using Azure.Messaging.ServiceBus;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

using Polly.CircuitBreaker;

namespace ArchLucid.Host.Composition.Tests.Services.Http;

/// <summary>Azure DevOps HTTP retry controls for status and compare calls (TB-587) and thread creation (FND-065).</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AzureDevOpsOutboundHttpResilienceTests
{
    [Theory]
    [InlineData(AzureDevOpsCommitStatusPublisher.HttpClientName)]
    [InlineData(AzureDevOpsPullRequestDecorator.HttpClientName)]
    public async Task Named_azure_devops_client_retries_after_two_503_then_200(string clientName)
    {
        Sequential503ThenOkHandler primary = new();

        ServiceCollection services = [];

        services.AddLogging(static b => b.SetMinimumLevel(LogLevel.None));
        services.Configure<OutboundExternalHttpResilienceOptions>(static o => o.MaxRetryAttempts = 3);

        services
            .AddHttpClient(clientName)
            .ConfigurePrimaryHttpMessageHandler(() => primary)
            .AddOutboundExternalHttpResilience(static _ => TimeSpan.Zero);

        await using ServiceProvider provider = services.BuildServiceProvider();
        IHttpClientFactory factory = provider.GetRequiredService<IHttpClientFactory>();

        using HttpClient http = factory.CreateClient(clientName);

        using HttpResponseMessage response =
            await http.GetAsync(new Uri("https://dev.azure.com/archlucid-test/_apis/git/statuses"));

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        primary.SendCount.Should().Be(3);
    }

    [Theory]
    [InlineData(null)]
    [InlineData(HttpStatusCode.ServiceUnavailable)]
    [InlineData(HttpStatusCode.TooManyRequests)]
    public async Task Thread_create_is_not_replayed_after_a_lost_response_or_transient_status(HttpStatusCode? firstStatus)
    {
        ThreadCreateHandler thread = new(firstStatus);
        RecordingClaimStore claims = new();
        using ServiceProvider provider = BuildProductionConsumer(thread, claims);

        IAzureDevOpsPullRequestDecorator decorator = provider
            .GetRequiredService<IAzureDevOpsPullRequestDecoratorFactory>().Create();

        AzureDevOpsManifestDeltaRequest request = new(
            Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), null, []);
        AzureDevOpsPullRequestTarget target = new(Guid.NewGuid(), 42);

        await decorator.PostManifestDeltaAsync(request, target, CancellationToken.None);

        thread.SendCount.Should().Be(1);
        claims.AttemptCount.Should().Be(1);
        thread.AcceptedCount.Should().Be(firstStatus is null ? 1 : 0);
    }

    [Fact]
    public async Task Thread_create_breaker_rejects_new_posts_without_replaying_failed_ones()
    {
        ThreadCreateHandler thread = new(HttpStatusCode.ServiceUnavailable, alwaysFail: true);
        RecordingClaimStore claims = new();
        using ServiceProvider provider = BuildProductionConsumer(thread, claims);
        using HttpClient client = provider.GetRequiredService<IHttpClientFactory>()
            .CreateClient(AzureDevOpsPullRequestDecorator.ThreadHttpClientName);
        Uri uri = new("https://dev.azure.com/test/_apis/git/pullrequests/42/threads?api-version=7.1");

        for (int i = 0; i < 2; i++)
        {
            using HttpRequestMessage request = CreateThreadRequest(uri);
            using HttpResponseMessage response = await client.SendAsync(request);
            response.StatusCode.Should().Be(HttpStatusCode.ServiceUnavailable);
        }

        Func<Task> rejected = async () =>
        {
            using HttpRequestMessage request = CreateThreadRequest(uri);
            using HttpResponseMessage response = await client.SendAsync(request);
        };
        await rejected.Should().ThrowAsync<BrokenCircuitException>();
        thread.SendCount.Should().Be(2);
        claims.AttemptCount.Should().Be(2, "an open breaker must not claim an unsent thread");
    }

    [Fact]
    public void Thread_transport_does_not_follow_redirects()
    {
        using ServiceProvider provider = BuildProductionConsumer();
        HttpMessageHandler transport = provider.GetRequiredService<IHttpMessageHandlerFactory>()
            .CreateHandler(AzureDevOpsPullRequestDecorator.ThreadHttpClientName);
        while (transport is DelegatingHandler { InnerHandler: { } inner })
            transport = inner;

        transport.Should().BeOfType<SocketsHttpHandler>().Which.AllowAutoRedirect.Should().BeFalse();
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Redelivery_after_failed_settlement_does_not_create_another_thread(bool loseResponse)
    {
        Guid repositoryId = Guid.NewGuid();
        Guid tenantId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();
        RecordingClaimStore sharedClaims = new();
        ThreadCreateHandler first = new(loseResponse ? null : HttpStatusCode.Created);
        ThreadCreateHandler replay = new(HttpStatusCode.Created);
        using ServiceProvider worker1 = BuildProductionConsumer(first, sharedClaims, repositoryId);
        using ServiceProvider worker2 = BuildProductionConsumer(replay, sharedClaims, repositoryId);

        ServiceBusReceivedMessage message = ServiceBusModelFactory.ServiceBusReceivedMessage(
            body: BinaryData.FromObjectAsJson(new
            {
                SchemaVersion = 1,
                TenantId = tenantId,
                RunId = runId,
                ManifestId = Guid.NewGuid(),
                WorkspaceId = Guid.NewGuid(),
                ProjectId = Guid.NewGuid(),
            }),
            subject: IntegrationEventTypes.AuthorityRunCompletedV1);
        TestSettlement beforeRestart = new(failCompletion: true);
        TestSettlement afterRestart = new(failCompletion: false);

        await DispatchAsync(worker1, message, beforeRestart);
        await DispatchAsync(worker2, message, afterRestart);

        first.SendCount.Should().Be(1);
        first.AcceptedCount.Should().Be(1);
        beforeRestart.AbandonCount.Should().Be(1);
        afterRestart.CompletionCount.Should().Be(1);
        sharedClaims.AttemptCount.Should().Be(2);
        replay.SendCount.Should().Be(0);
    }

    [Fact]
    public async Task Thread_create_does_not_send_when_the_claim_store_is_unavailable()
    {
        ThreadCreateHandler thread = new(HttpStatusCode.Created);
        using ServiceProvider provider = BuildProductionConsumer(thread, new FailingClaimStore());

        IAzureDevOpsPullRequestDecorator decorator = provider
            .GetRequiredService<IAzureDevOpsPullRequestDecoratorFactory>().Create();

        AzureDevOpsManifestDeltaRequest request = new(
            Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), null, []);
        AzureDevOpsPullRequestTarget target = new(Guid.NewGuid(), 42);

        await decorator.PostManifestDeltaAsync(request, target, CancellationToken.None);

        thread.SendCount.Should().Be(0);
    }

    [Fact]
    public async Task Thread_claim_does_not_override_an_active_different_tenant()
    {
        ThreadCreateHandler thread = new(HttpStatusCode.Created);
        RecordingClaimStore claims = new();
        using ServiceProvider provider = BuildProductionConsumer(thread, claims);
        using IDisposable ambient = AmbientScopeContext.Push(new ScopeContext { TenantId = Guid.NewGuid() });

        IAzureDevOpsPullRequestDecorator decorator = provider
            .GetRequiredService<IAzureDevOpsPullRequestDecoratorFactory>().Create();
        AzureDevOpsManifestDeltaRequest request = new(
            Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), null, []);

        await decorator.PostManifestDeltaAsync(request, new AzureDevOpsPullRequestTarget(Guid.NewGuid(), 42),
            CancellationToken.None);

        claims.AttemptCount.Should().Be(0);
        thread.SendCount.Should().Be(0);
    }

    private static Task DispatchAsync(
        ServiceProvider worker,
        ServiceBusReceivedMessage message,
        TestSettlement settlement) =>
        IntegrationEventServiceBusMessageDispatch.ProcessPeekLockedMessageAsync(
            message, settlement,
            [ActivatorUtilities.CreateInstance<AuthorityRunCompletedAzureDevOpsIntegrationEventHandler>(worker)],
            worker.GetRequiredService<ILogger<AuthorityRunCompletedAzureDevOpsIntegrationEventHandler>>(),
            CancellationToken.None);

    private static HttpRequestMessage CreateThreadRequest(Uri uri)
    {
        HttpRequestMessage request = new(HttpMethod.Post, uri)
        {
            Content = new StringContent("{}"),
        };
        request.Options.Set(AzureDevOpsPullRequestDecorator.ThreadCreateClaimOption,
            new AzureDevOpsThreadCreateClaim(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), 42));

        return request;
    }

    private sealed class RecordingClaimStore : IAzureDevOpsThreadCreateClaimStore
    {
        private readonly InMemoryAzureDevOpsThreadCreateClaimStore _inner = new();

        public int AttemptCount { get; private set; }

        public Task<bool> TryClaimAsync(AzureDevOpsThreadCreateClaim claim, CancellationToken cancellationToken)
        {
            AmbientScopeContext.CurrentOverride.Should().NotBeNull();
            AmbientScopeContext.CurrentOverride!.TenantId.Should().Be(claim.TenantId);
            AttemptCount++;

            return _inner.TryClaimAsync(claim, cancellationToken);
        }
    }

    private sealed class FailingClaimStore : IAzureDevOpsThreadCreateClaimStore
    {
        public Task<bool> TryClaimAsync(AzureDevOpsThreadCreateClaim claim, CancellationToken cancellationToken) =>
            throw new InvalidOperationException("Simulated claim store outage.");
    }

    private sealed class TestSettlement(bool failCompletion) : IIntegrationEventPeekLockSettlement
    {
        public int CompletionCount { get; private set; }
        public int AbandonCount { get; private set; }

        public Task CompleteAsync(ServiceBusReceivedMessage message, CancellationToken cancellationToken)
        {
            if (failCompletion)
                throw new InvalidOperationException("Simulated lost Service Bus settlement.");

            CompletionCount++;

            return Task.CompletedTask;
        }

        public Task AbandonAsync(ServiceBusReceivedMessage message, CancellationToken cancellationToken)
        {
            AbandonCount++;

            return Task.CompletedTask;
        }

        public Task DeadLetterAsync(
            ServiceBusReceivedMessage message, string deadLetterReason, string deadLetterErrorDescription,
            CancellationToken cancellationToken) => throw new InvalidOperationException(deadLetterReason);
    }

    private static ServiceProvider BuildProductionConsumer(
        ThreadCreateHandler? thread = null,
        IAzureDevOpsThreadCreateClaimStore? claimStore = null,
        Guid? repositoryId = null)
    {
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(
            new Dictionary<string, string?>
            {
                ["ArchLucid:StorageProvider"] = "InMemory",
                [$"{AzureDevOpsIntegrationOptions.SectionName}:Enabled"] = "true",
                [$"{AzureDevOpsIntegrationOptions.SectionName}:RepositoryId"] = (repositoryId ?? Guid.NewGuid()).ToString("D"),
                [$"{AzureDevOpsIntegrationOptions.SectionName}:PullRequestId"] = "42",
                [$"{AzureDevOpsIntegrationOptions.SectionName}:Organization"] = "org",
                [$"{AzureDevOpsIntegrationOptions.SectionName}:Project"] = "proj",
                [$"{AzureDevOpsIntegrationOptions.SectionName}:PersonalAccessToken"] = "fake-pat",
            }).Build();

        ServiceCollection services = [];
        services.AddLogging(static b => b.SetMinimumLevel(LogLevel.None));
        services.Configure<OutboundExternalHttpResilienceOptions>(static o =>
        {
            o.MaxRetryAttempts = 3;
            o.MinimumThroughput = 2;
        });
        OutboxProcessorsCompositionRegistrar.RegisterIntegrationEventConsumer(
            services, configuration, ArchLucidHostingRole.Worker);

        if (claimStore is not null)
            services.AddSingleton(claimStore);

        if (thread is not null)
        {
            services.AddHttpClient(AzureDevOpsPullRequestDecorator.ThreadHttpClientName)
                .ConfigurePrimaryHttpMessageHandler(() => thread);
            services.AddHttpClient(AzureDevOpsPullRequestDecorator.HttpClientName)
                .ConfigurePrimaryHttpMessageHandler(static () => new StatusOkHandler());
        }

        return services.BuildServiceProvider();
    }

    private sealed class StatusOkHandler : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            request.Method.Should().Be(HttpMethod.Post);
            request.RequestUri!.AbsolutePath.Should().EndWith("/statuses");

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK));
        }
    }

    private sealed class ThreadCreateHandler(HttpStatusCode? firstStatus, bool alwaysFail = false) : HttpMessageHandler
    {
        public int SendCount { get; private set; }
        public int AcceptedCount { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            request.Method.Should().Be(HttpMethod.Post);
            request.RequestUri!.AbsolutePath.Should().EndWith("/threads");
            SendCount++;

            HttpStatusCode? status = SendCount == 1 || alwaysFail ? firstStatus : HttpStatusCode.Created;
            if (status is null || (int)status.Value is >= 200 and < 300)
                AcceptedCount++;

            if (status is null)
                throw new HttpRequestException("Simulated lost response after the thread was created.");

            return Task.FromResult(new HttpResponseMessage(status.Value));
        }
    }

    private sealed class Sequential503ThenOkHandler : HttpMessageHandler
    {
        public int SendCount
        {
            get; private set;
        }

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            SendCount++;

            HttpStatusCode status = SendCount switch
            {
                1 => HttpStatusCode.ServiceUnavailable,
                2 => HttpStatusCode.ServiceUnavailable,
                _ => HttpStatusCode.OK,
            };

            return Task.FromResult(new HttpResponseMessage(status));
        }
    }
}
