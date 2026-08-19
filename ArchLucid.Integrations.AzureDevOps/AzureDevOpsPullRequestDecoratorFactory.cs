using ArchLucid.Contracts.Abstractions.Integrations;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Integrations.AzureDevOps;

/// <inheritdoc cref="IAzureDevOpsPullRequestDecoratorFactory" />
public sealed class AzureDevOpsPullRequestDecoratorFactory(
    IHttpClientFactory httpClientFactory,
    IOptions<AzureDevOpsIntegrationOptions> options,
    ILogger<AzureDevOpsPullRequestDecorator> logger) : IAzureDevOpsPullRequestDecoratorFactory
{
    private readonly IHttpClientFactory _httpClientFactory =
        httpClientFactory ?? throw new ArgumentNullException(nameof(httpClientFactory));

    private readonly IOptions<AzureDevOpsIntegrationOptions> _options =
        options ?? throw new ArgumentNullException(nameof(options));

    private readonly ILogger<AzureDevOpsPullRequestDecorator> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public IAzureDevOpsPullRequestDecorator Create()
    {
        HttpClient httpClient = _httpClientFactory.CreateClient(AzureDevOpsPullRequestDecorator.HttpClientName);

        return new AzureDevOpsPullRequestDecorator(httpClient, _options, _logger);
    }
}
