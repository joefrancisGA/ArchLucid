using System.Net;

using ArchLucid.Core.Http;
using ArchLucid.Host.Core.Http;
using ArchLucid.Integrations.AzureDevOps;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Host.Composition.Tests.Services.Http;

/// <summary>Validates Polly wired on named Azure DevOps HTTP clients retries transient 503 responses (TB-587).</summary>
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
