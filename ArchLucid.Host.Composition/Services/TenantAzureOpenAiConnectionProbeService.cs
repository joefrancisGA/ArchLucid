using ArchLucid.AgentRuntime;
using ArchLucid.Application.AiProviders;
using ArchLucid.Contracts.Admin;
using ArchLucid.Core.AiProviders;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Secrets;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Host.Composition.Services;

public sealed class TenantAzureOpenAiConnectionProbeService(
    ITenantAzureOpenAiConnectionRepository repository,
    ISecretProvider secretProvider,
    IConfiguration configuration,
    ILogger<TenantAzureOpenAiConnectionProbeService> logger) : ITenantAzureOpenAiConnectionProbeService
{
    private readonly ITenantAzureOpenAiConnectionRepository _repository =
        repository ?? throw new ArgumentNullException(nameof(repository));

    private readonly ISecretProvider _secretProvider =
        secretProvider ?? throw new ArgumentNullException(nameof(secretProvider));

    private readonly IConfiguration _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));

    private readonly ILogger<TenantAzureOpenAiConnectionProbeService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task<TenantAzureOpenAiConnectionProbeResponse> ProbeAsync(
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        TenantAzureOpenAiConnectionRecord? row =
            await _repository.GetAsync(tenantId, cancellationToken).ConfigureAwait(false);

        if (row is null || !row.IsEnabled)
        {
            return Failed("No enabled Azure OpenAI connection is configured for this workspace.");
        }

        string? apiKey = await _secretProvider
            .GetSecretAsync(row.ApiKeyKeyVaultSecretName, cancellationToken)
            .ConfigureAwait(false);

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            await PersistProbeAsync(tenantId, false, "API key secret is missing or empty.", cancellationToken)
                .ConfigureAwait(false);

            return Failed("API key secret is missing or empty.");
        }

        if (!TenantAzureOpenAiDeploymentsCatalog.TryParse(row.DeploymentsJson, out IReadOnlyDictionary<string, string> map, out string? parseError))
        {
            await PersistProbeAsync(tenantId, false, parseError!, cancellationToken).ConfigureAwait(false);

            return Failed(parseError!);
        }

        string deployment = map.Values.First(v => !string.IsNullOrWhiteSpace(v)).Trim();
        int maxTokens = _configuration.GetValue("AzureOpenAI:MaxCompletionTokens", 0);

        if (maxTokens <= 0)
        {
            maxTokens = AzureOpenAiCompletionClient.DefaultMaxCompletionTokens;
        }

        try
        {
            using AzureOpenAiCompletionClient client = new(
                row.Endpoint,
                apiKey,
                deployment,
                maxTokens);

            string response = await client
                .CompleteJsonAsync("Reply with OK.", "Health probe", cancellationToken: cancellationToken)
                .ConfigureAwait(false);

            bool ok = !string.IsNullOrWhiteSpace(response);
            string message = ok ? "Connection probe succeeded." : "Connection probe returned an empty response.";
            await PersistProbeAsync(tenantId, ok, message, cancellationToken).ConfigureAwait(false);

            return new TenantAzureOpenAiConnectionProbeResponse { Succeeded = ok, Message = message };
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Azure OpenAI BYO probe failed for tenant {TenantId}", tenantId);
            string message = "Connection probe failed. Verify endpoint, deployment, and API key secret.";
            await PersistProbeAsync(tenantId, false, message, cancellationToken).ConfigureAwait(false);

            return Failed(message);
        }
    }

    private async Task PersistProbeAsync(
        Guid tenantId,
        bool succeeded,
        string message,
        CancellationToken cancellationToken)
    {
        await _repository.UpdateProbeResultAsync(tenantId, succeeded, message, cancellationToken).ConfigureAwait(false);
    }

    private static TenantAzureOpenAiConnectionProbeResponse Failed(string message) =>
        new() { Succeeded = false, Message = message };
}
