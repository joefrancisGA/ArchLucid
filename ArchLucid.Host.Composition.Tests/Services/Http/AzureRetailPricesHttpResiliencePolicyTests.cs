using System.Net;

using ArchLucid.Core.Http;

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
            .AddPolicyHandler(static (sp, _) =>
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

    private sealed class Always503Handler : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) =>
            Task.FromResult(new HttpResponseMessage(HttpStatusCode.ServiceUnavailable));
    }
}
