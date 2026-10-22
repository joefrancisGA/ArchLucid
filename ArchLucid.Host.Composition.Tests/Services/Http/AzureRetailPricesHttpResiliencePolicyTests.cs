using System.Net;

using ArchLucid.Host.Core.Http;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

using Polly.CircuitBreaker;

namespace ArchLucid.Host.Composition.Tests.Services.Http;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AzureRetailPricesHttpResiliencePolicyTests
{
    [SkippableFact]
    public async Task Retail_prices_client_opens_circuit_after_five_consecutive_failures()
    {
        Always503Handler primary = new();

        ServiceCollection services = [];
        services.AddLogging(static b => b.SetMinimumLevel(LogLevel.Warning));

        services
            .AddHttpClient(ArchLucidAzurePublicHttpClients.RetailPricesHttpClientName)
            .ConfigurePrimaryHttpMessageHandler(() => primary)
            .AddLongLivedPolicyHandler(static sp =>
                AzureRetailPricesHttpResiliencePolicy.Create(
                    sp.GetRequiredService<ILoggerFactory>().CreateLogger("tests.Retail.CB"),
                    static _ => TimeSpan.Zero));

        await using ServiceProvider provider = services.BuildServiceProvider();
        IHttpClientFactory factory = provider.GetRequiredService<IHttpClientFactory>();

        using HttpClient http = factory.CreateClient(ArchLucidAzurePublicHttpClients.RetailPricesHttpClientName);
        http.BaseAddress = ArchLucidAzurePublicHttpClients.RetailPricesAuthority;

        Uri path = new(http.BaseAddress!, "api/retail/prices?api-version=2023-01-01-preview");

        for (int i = 0; i < AzureRetailPricesHttpResiliencePolicy.CircuitBreakerFailureThreshold; i++)
        {
            using HttpResponseMessage response = await http.GetAsync(path);
            response.StatusCode.Should().Be(HttpStatusCode.ServiceUnavailable);
        }

        Func<Task> act = async () =>
        {
            using HttpResponseMessage response = await http.GetAsync(path);
            _ = response;
        };

        await act.Should().ThrowAsync<BrokenCircuitException>();
    }

    [SkippableFact]
    public async Task Retail_prices_client_logs_retry_after_on_429()
    {
        Sequential429ThenOkHandler primary = new();
        ListLoggingProvider logging = new();

        ServiceCollection services = [];
        logging.Attach(services);

        services
            .AddHttpClient(ArchLucidAzurePublicHttpClients.RetailPricesHttpClientName)
            .ConfigurePrimaryHttpMessageHandler(() => primary)
            .AddLongLivedPolicyHandler(static sp =>
                AzureRetailPricesHttpResiliencePolicy.Create(
                    sp.GetRequiredService<ILoggerFactory>().CreateLogger("tests.Retail.429"),
                    static _ => TimeSpan.Zero));

        await using ServiceProvider provider = services.BuildServiceProvider();
        IHttpClientFactory factory = provider.GetRequiredService<IHttpClientFactory>();

        using HttpClient http = factory.CreateClient(ArchLucidAzurePublicHttpClients.RetailPricesHttpClientName);
        http.BaseAddress = ArchLucidAzurePublicHttpClients.RetailPricesAuthority;

        Uri path = new(http.BaseAddress!, "api/retail/prices?api-version=2023-01-01-preview");

        using HttpResponseMessage response = await http.GetAsync(path);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        logging.WarningMessages.Should().ContainSingle(m =>
            m.Contains("429", StringComparison.Ordinal) && m.Contains("Retry-After=120", StringComparison.Ordinal));
    }

    private sealed class Sequential429ThenOkHandler : HttpMessageHandler
    {
        private int _sendCount;

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            _sendCount++;

            if (_sendCount == 1)
            {
                HttpResponseMessage rateLimited = new(HttpStatusCode.TooManyRequests);
                rateLimited.Headers.TryAddWithoutValidation("Retry-After", "120");

                return Task.FromResult(rateLimited);
            }

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK));
        }
    }

    private sealed class ListLoggingProvider : ILoggerProvider
    {
        private readonly List<string> _warnings = [];

        public IReadOnlyList<string> WarningMessages => _warnings;

        public void Attach(ServiceCollection services)
        {
            services.AddLogging(b =>
            {
                b.SetMinimumLevel(LogLevel.Warning);
                b.AddProvider(this);
            });
        }

        public ILogger CreateLogger(string categoryName) => new WarningOnlyLogger(_warnings);

        public void Dispose()
        {
        }

        private sealed class WarningOnlyLogger(List<string> sink) : ILogger
        {
            public IDisposable? BeginScope<TState>(TState state)
                where TState : notnull => null;

            public bool IsEnabled(LogLevel logLevel) => logLevel >= LogLevel.Warning;

            public void Log<TState>(
                LogLevel logLevel,
                EventId eventId,
                TState state,
                Exception? exception,
                Func<TState, Exception?, string> formatter)
            {
                if (!IsEnabled(logLevel))

                    return;

                sink.Add(formatter(state, exception));
            }
        }
    }

    private sealed class Always503Handler : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) =>
            Task.FromResult(new HttpResponseMessage(HttpStatusCode.ServiceUnavailable));
    }
}
