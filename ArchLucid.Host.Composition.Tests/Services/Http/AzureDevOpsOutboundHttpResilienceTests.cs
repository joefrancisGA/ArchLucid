using System.Net;

using ArchLucid.Contracts.Abstractions.Integrations;
using ArchLucid.Core.Http;
using ArchLucid.Host.Composition.Startup.Modules;
using ArchLucid.Host.Core.Hosting;
using ArchLucid.Host.Core.Http;
using ArchLucid.Integrations.AzureDevOps;

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
        using ServiceProvider provider = BuildProductionConsumer(thread);

        IAzureDevOpsPullRequestDecorator decorator = provider
            .GetRequiredService<IAzureDevOpsPullRequestDecoratorFactory>().Create();

        AzureDevOpsManifestDeltaRequest request = new(
            Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), null, []);
        AzureDevOpsPullRequestTarget target = new(Guid.NewGuid(), 42);

        await decorator.PostManifestDeltaAsync(request, target, CancellationToken.None);

        thread.SendCount.Should().Be(1);
        thread.AcceptedCount.Should().Be(firstStatus is null ? 1 : 0);
    }

    [Fact]
    public async Task Thread_create_breaker_rejects_new_posts_without_replaying_failed_ones()
    {
        ThreadCreateHandler thread = new(HttpStatusCode.ServiceUnavailable, alwaysFail: true);
        using ServiceProvider provider = BuildProductionConsumer(thread);
        using HttpClient client = provider.GetRequiredService<IHttpClientFactory>()
            .CreateClient(AzureDevOpsPullRequestDecorator.ThreadHttpClientName);
        Uri uri = new("https://dev.azure.com/test/_apis/git/pullrequests/42/threads?api-version=7.1");

        for (int i = 0; i < 2; i++)
        {
            using StringContent body = new("{}");
            using HttpResponseMessage response = await client.PostAsync(uri, body);
            response.StatusCode.Should().Be(HttpStatusCode.ServiceUnavailable);
        }

        using StringContent rejectedBody = new("{}");
        Func<Task> rejected = async () =>
        {
            using HttpResponseMessage response = await client.PostAsync(uri, rejectedBody);
        };
        await rejected.Should().ThrowAsync<BrokenCircuitException>();
        thread.SendCount.Should().Be(2);
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

    private static ServiceProvider BuildProductionConsumer(ThreadCreateHandler? thread = null)
    {
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(
            new Dictionary<string, string?>
            {
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

            if (SendCount == 1 || alwaysFail)
            {
                if (firstStatus is { } status)
                    return Task.FromResult(new HttpResponseMessage(status));

                AcceptedCount++;

                throw new HttpRequestException("Simulated lost response after the thread was created.");
            }

            AcceptedCount++;

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.Created));
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
