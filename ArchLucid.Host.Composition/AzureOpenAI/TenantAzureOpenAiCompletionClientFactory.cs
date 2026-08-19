using ArchLucid.AgentRuntime;
using ArchLucid.AgentRuntime.AgentModelAliases;
using ArchLucid.Core.AiProviders;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Secrets;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Composition.AzureOpenAI;

public interface ITenantAzureOpenAiCompletionClientFactory
{
    Task<AzureOpenAiCompletionClient?> TryCreateAsync(
        Guid tenantId,
        string tierDeploymentName,
        CancellationToken cancellationToken);
}

/// <summary>Resolves per-tenant BYO Azure OpenAI clients without falling back to ArchLucid-managed capacity (TB-872).</summary>
public sealed class TenantAzureOpenAiCompletionClientFactory(
    ITenantAzureOpenAiConnectionRepository repository,
    ISecretProvider secretProvider,
    IConfiguration configuration,
    IOptions<AzureOpenAiOptions> azureOpenAiOptions,
    ILogger<TenantAzureOpenAiCompletionClientFactory> logger) : ITenantAzureOpenAiCompletionClientFactory
{
    private readonly ITenantAzureOpenAiConnectionRepository _repository =
        repository ?? throw new ArgumentNullException(nameof(repository));

    private readonly ISecretProvider _secretProvider =
        secretProvider ?? throw new ArgumentNullException(nameof(secretProvider));

    private readonly IConfiguration _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));

    private readonly AzureOpenAiOptions _azureOpenAiOptions =
        azureOpenAiOptions?.Value ?? throw new ArgumentNullException(nameof(azureOpenAiOptions));

    private readonly ILogger<TenantAzureOpenAiCompletionClientFactory> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task<AzureOpenAiCompletionClient?> TryCreateAsync(
        Guid tenantId,
        string tierDeploymentName,
        CancellationToken cancellationToken)
    {
        TenantAzureOpenAiConnectionRecord? row =
            await _repository.GetAsync(tenantId, cancellationToken).ConfigureAwait(false);

        if (row is null || !row.IsEnabled)
        {
            return null;
        }

        string? apiKey = await _secretProvider
            .GetSecretAsync(row.ApiKeyKeyVaultSecretName, cancellationToken)
            .ConfigureAwait(false);

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            _logger.LogWarning(
                "Tenant {TenantId} BYO Azure OpenAI connection is enabled but API key secret is missing.",
                tenantId);

            throw new InvalidOperationException(
                "Customer Azure OpenAI connection is enabled but the API key secret is missing.");
        }

        string deployment = TenantAzureOpenAiDeploymentsCatalog.ResolveDeploymentName(
            row.DeploymentsJson,
            tierDeploymentName);

        TenantAzureOpenAiProviderConnectionAmbient.Set(row.ProviderConnectionId);

        int maxTokens = _configuration.GetValue("AzureOpenAI:MaxCompletionTokens", 0);

        if (maxTokens <= 0)
        {
            maxTokens = AzureOpenAiCompletionClient.DefaultMaxCompletionTokens;
        }

        BinaryData? schema = TenantAzureOpenAiStructuredOutputSchema.Resolve(_configuration, _azureOpenAiOptions);

        return new AzureOpenAiCompletionClient(
            row.Endpoint,
            apiKey,
            deployment,
            maxTokens,
            schema,
            logger: null);
    }
}
