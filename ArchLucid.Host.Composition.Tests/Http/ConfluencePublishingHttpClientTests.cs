using System.Net;
using System.Net.Http.Headers;

using ArchLucid.Application.Connectors.Publishing;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Connectors.Publishing;
using ArchLucid.Core.Http;
using ArchLucid.Host.Composition.Startup.Modules;

using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Tests.Http;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ConfluencePublishingHttpClientTests
{
    [Theory]
    [InlineData(true, ConfluencePublishFailureReason.NetworkError)]
    [InlineData(false, ConfluencePublishFailureReason.ServerError)]
    public async Task Page_create_is_not_replayed_when_a_successful_create_loses_its_response(
        bool connectionLost,
        ConfluencePublishFailureReason expectedFailure)
    {
        AcceptingHandler handler = new(connectionLost);
        ServiceCollection services = CreateRegistrations();
        services.AddHttpClient(nameof(IPublisherConnector)).ConfigurePrimaryHttpMessageHandler(() => handler);
        await using ServiceProvider provider = services.BuildServiceProvider();
        IPublisherConnector publisher = provider.GetRequiredService<IPublisherConnector>();
        PublishOutcome result = await publisher.PublishDocumentAsync(CreateRequest(), CancellationToken.None);

        Assert.Equal(1, handler.AcceptedCreates);
        Assert.False(result.Succeeded);
        Assert.Null(result.ExternalPageId);
        Assert.Equal(expectedFailure, result.FailureReason);
        Assert.Contains("before retrying", result.ErrorMessage);
    }

    [Fact]
    public async Task Open_breaker_reports_that_create_was_not_sent()
    {
        AcceptingHandler handler = new(connectionLost: false, alwaysFail: true);
        ServiceCollection services = CreateRegistrations(enableBreaker: true);
        services.AddHttpClient(nameof(IPublisherConnector)).ConfigurePrimaryHttpMessageHandler(() => handler);
        await using ServiceProvider provider = services.BuildServiceProvider();
        IPublisherConnector publisher = provider.GetRequiredService<IPublisherConnector>();

        for (int call = 0; call < 2; call++)
        {
            PublishOutcome failure = await publisher.PublishDocumentAsync(CreateRequest(), CancellationToken.None);
            Assert.Equal(ConfluencePublishFailureReason.ServerError, failure.FailureReason);
        }

        PublishOutcome result = await publisher.PublishDocumentAsync(CreateRequest(), CancellationToken.None);

        Assert.Equal(2, handler.AcceptedCreates);
        Assert.False(result.Succeeded);
        Assert.Contains("was not sent", result.ErrorMessage);
    }

    [Fact]
    public async Task Caller_cancellation_is_not_reported_as_an_ambiguous_create()
    {
        AcceptingHandler handler = new(connectionLost: false);
        ServiceCollection services = CreateRegistrations();
        services.AddHttpClient(nameof(IPublisherConnector)).ConfigurePrimaryHttpMessageHandler(() => handler);
        await using ServiceProvider provider = services.BuildServiceProvider();
        IPublisherConnector publisher = provider.GetRequiredService<IPublisherConnector>();
        using CancellationTokenSource cts = new();
        await cts.CancelAsync();

        await Assert.ThrowsAnyAsync<OperationCanceledException>(() => publisher.PublishDocumentAsync(CreateRequest(), cts.Token));
        Assert.Equal(0, handler.AcceptedCreates);
    }

    [Fact]
    public void Page_create_transport_does_not_follow_redirects_automatically()
    {
        using ServiceProvider provider = CreateRegistrations().BuildServiceProvider();
        HttpMessageHandler handler = provider.GetRequiredService<IHttpMessageHandlerFactory>()
            .CreateHandler(nameof(IPublisherConnector));

        while (handler is DelegatingHandler { InnerHandler: { } inner })
        {
            handler = inner;
        }

        Assert.False(Assert.IsType<SocketsHttpHandler>(handler).AllowAutoRedirect);
    }

    private static PublishRequest CreateRequest()
    {
        Guid id = Guid.NewGuid();
        return new PublishRequest(id, id, id, id, id, "1", "", "Report body", "Report title", null);
    }

    private static ServiceCollection CreateRegistrations(bool enableBreaker = false)
    {
        ServiceCollection services = [];
        services.AddLogging();
        services.AddSingleton<IConfluencePublishingHttpAuthenticator, TestAuthenticator>();
        services.Configure<ConfluencePublishingOptions>(static options =>
        {
            options.Enabled = true;
            options.CloudBaseUrl = "https://confluence.test";
            options.SpaceKey = "DOCS";
        });
        services.Configure<OutboundExternalHttpResilienceOptions>(options =>
        {
            options.MaxRetryAttempts = 1;
            options.CircuitBreakerEnabled = enableBreaker;
            options.MinimumThroughput = 2;
            options.FailureRatio = 1;
        });
        RunLifecycleOrchestrationCompositionRegistrar.RegisterConfluencePublishingHttpClient(services);
        return services;
    }

    private sealed class AcceptingHandler(bool connectionLost, bool alwaysFail = false) : HttpMessageHandler
    {
        public int AcceptedCreates { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Assert.Equal(HttpMethod.Post, request.Method);
            Assert.Equal("/wiki/rest/api/content", request.RequestUri!.AbsolutePath);

            int attempt = ++AcceptedCreates;

            if (attempt > 1 && !alwaysFail)
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.Created)
                {
                    Content = new StringContent("""{"id":"duplicate"}"""),
                });
            }

            return connectionLost
                ? Task.FromException<HttpResponseMessage>(new HttpRequestException("Test connection lost after vendor commit."))
                : Task.FromResult(new HttpResponseMessage(HttpStatusCode.ServiceUnavailable));
        }
    }

    private sealed class TestAuthenticator : IConfluencePublishingHttpAuthenticator
    {
        public Task<AuthenticationHeaderValue?> TryCreateAuthorizationHeaderAsync(CancellationToken cancellationToken) =>
            Task.FromResult<AuthenticationHeaderValue?>(new AuthenticationHeaderValue("Basic", "test"));
    }
}
