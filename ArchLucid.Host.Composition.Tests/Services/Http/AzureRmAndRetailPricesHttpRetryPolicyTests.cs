using System.Net;

using ArchLucid.Core.Http;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Host.Composition.Tests.Services.Http;

/// <summary>Validates Polly on ARM / Retail Prices HTTP clients retries transient HTTP 503 and logs retries at warning level.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AzureRmAndRetailPricesHttpRetryPolicyTests
{
    public static TheoryData<string> AzurePublicClientNames =>
    [
        ArchLucidAzurePublicHttpClients.ResourceManagerHttpClientName,
        ArchLucidAzurePublicHttpClients.RetailPricesHttpClientName
    ];

    [Theory]
    [MemberData(nameof(AzurePublicClientNames))]
    public async Task Named_azure_public_client_retries_after_two_503_then_200_and_logs_each_retry_attempt(string namedClient)
    {
        Sequential503ThenOkHandler primary = new();
        ListLoggingProvider logging = new();

        ServiceCollection services = [];
        logging.Attach(services);

        services
            .AddHttpClient(namedClient)
            .ConfigurePrimaryHttpMessageHandler(() => primary)
            .AddPolicyHandler(static (sp, _) =>
                AzureRmAndRetailPricesHttpRetryPolicy.Create(
                    sp.GetRequiredService<ILoggerFactory>().CreateLogger("tests.Azure.Retry"),
                    static _ => TimeSpan.Zero));

        await using ServiceProvider provider = services.BuildServiceProvider();
        IHttpClientFactory factory = provider.GetRequiredService<IHttpClientFactory>();

        using HttpClient http = factory.CreateClient(namedClient);
        http.BaseAddress =
            namedClient == ArchLucidAzurePublicHttpClients.ResourceManagerHttpClientName
                ? ArchLucidAzurePublicHttpClients.ResourceManagerAuthority
                : ArchLucidAzurePublicHttpClients.RetailPricesAuthority;

        string relativePath =
            namedClient == ArchLucidAzurePublicHttpClients.ResourceManagerHttpClientName
                ? "subscriptions/00000000-0000-0000-0000-000000000000/providers/Microsoft.CostManagement/query?api-version=2023-11-01"
                : "api/retail/prices?api-version=2023-01-01-preview";

        using HttpResponseMessage response = await http.GetAsync(new Uri(http.BaseAddress, relativePath));

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        primary.SendCount.Should().Be(3);
        logging.WarningMessages.Should().HaveCount(2);
        logging.WarningMessages.Should().OnlyContain(m => m.Contains("503", StringComparison.Ordinal));
    }

    private sealed class Sequential503ThenOkHandler : HttpMessageHandler
    {
        public int SendCount
        {
            get; private set;
        }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
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
            private readonly List<string> _sink = sink;

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

                _sink.Add(formatter(state, exception));
            }
        }
    }
}
