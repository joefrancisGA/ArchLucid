using ArchLucid.AgentRuntime;
using ArchLucid.Core.AiProviders;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Hosting;
using ArchLucid.Core.Secrets;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Host.Composition.Services;

/// <summary>
///     One-shot Azure OpenAI completion probes for workspace AI availability diagnostics.
///     Uses <see cref="AzureOpenAiCompletionClient" /> directly (not <c>LlmCompletionAccountingClient</c>) so tenant LLM
///     budgets are not charged — platform-managed probes are absorbed by ArchLucid; BYO probes bill the customer's Azure key.
/// </summary>
public static class WorkspaceAiLiveCompletionProbe
{
    /// <summary>
    ///     Azure OpenAI requires the word &quot;json&quot; in chat messages when <c>response_format</c> is
    ///     <c>json_object</c> (see <see cref="AzureOpenAiCompletionClient.CompleteJsonAsync" />).
    /// </summary>
    public const string ProbeSystemPrompt = "Reply with a minimal JSON object.";
    public const string ProbeUserPrompt = "Health probe — respond in json.";

    public static AzureOpenAiCompletionClient? TryCreateManagedPlatformClient(
        IConfiguration configuration,
        ILogger<AzureOpenAiCompletionClient>? logger = null)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        if (!AzureOpenAiConfigurationProbe.IsCompletionStackConfigured(configuration))
        {
            return null;
        }

        string endpoint = configuration[$"{AzureOpenAiOptions.SectionName}:Endpoint"]!.Trim();
        string deployment = configuration[$"{AzureOpenAiOptions.SectionName}:DeploymentName"]!.Trim();
        int maxTokens = WorkspaceAiAvailabilityProbeLimits.MaxCompletionTokens;

        if (AzureOpenAiConfigurationProbe.UsesManagedIdentity(configuration))
        {
            return AzureOpenAiCompletionClient.CreateWithManagedIdentity(
                endpoint,
                deployment,
                maxTokens,
                structuredOutputAgentResultSchema: null,
                logger,
                llmTelemetryOptions: null);
        }

        string? apiKey = configuration[$"{AzureOpenAiOptions.SectionName}:ApiKey"]?.Trim();

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return null;
        }

        return new AzureOpenAiCompletionClient(
            endpoint,
            apiKey,
            deployment,
            maxTokens,
            structuredOutputAgentResultSchema: null,
            logger,
            llmTelemetryOptions: null);
    }

    /// <summary>Builds a same-family fallback completion client for availability probes (not tenant-metered).</summary>
    public static AzureOpenAiCompletionClient? TryCreateFallbackClient(
        FallbackLlmResolvedEndpoint row,
        ILogger<AzureOpenAiCompletionClient>? logger = null)
    {
        ArgumentNullException.ThrowIfNull(row);

        int maxTokens = WorkspaceAiAvailabilityProbeLimits.MaxCompletionTokens;

        if (row.UseManagedIdentity)
        {
            return AzureOpenAiCompletionClient.CreateWithManagedIdentity(
                row.Endpoint,
                row.DeploymentName,
                maxTokens,
                structuredOutputAgentResultSchema: null,
                logger,
                llmTelemetryOptions: null);
        }

        if (string.IsNullOrWhiteSpace(row.ApiKey))
            return null;

        return new AzureOpenAiCompletionClient(
            row.Endpoint,
            row.ApiKey,
            row.DeploymentName,
            maxTokens,
            structuredOutputAgentResultSchema: null,
            logger,
            llmTelemetryOptions: null);
    }

    public static async Task<(AzureOpenAiCompletionClient Client, string DeploymentName)?> TryCreateCustomerConnectionClientAsync(
        TenantAzureOpenAiConnectionRecord row,
        ISecretProvider secretProvider,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(row);
        ArgumentNullException.ThrowIfNull(secretProvider);

        string? apiKey = await secretProvider
            .GetSecretAsync(row.ApiKeyKeyVaultSecretName, cancellationToken)
            .ConfigureAwait(false);

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return null;
        }

        if (!TenantAzureOpenAiDeploymentsCatalog.TryParse(row.DeploymentsJson, out IReadOnlyDictionary<string, string> map, out string? parseError))
        {
            throw new InvalidOperationException(parseError ?? "Customer deployment catalog is invalid.");
        }

        string deployment = map.Values.First(v => !string.IsNullOrWhiteSpace(v)).Trim();

        AzureOpenAiCompletionClient client = new(
            row.Endpoint,
            apiKey,
            deployment,
            WorkspaceAiAvailabilityProbeLimits.MaxCompletionTokens);

        return (client, deployment);
    }

    public static async Task<WorkspaceAiLiveCompletionProbeResult> RunAsync(
        AzureOpenAiCompletionClient client,
        string deploymentName,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(client);
        ArgumentException.ThrowIfNullOrWhiteSpace(deploymentName);

        try
        {
            string response = await client
                .CompleteJsonAsync(
                    ProbeSystemPrompt,
                    ProbeUserPrompt,
                    maxTokens: WorkspaceAiAvailabilityProbeLimits.MaxCompletionTokens,
                    temperature: null,
                    cancellationToken: cancellationToken)
                .ConfigureAwait(false);

            string? modelId = null;

            if (AzureOpenAiCompletionClient.TryConsumeLastModelMetadata(out _, out string? resolvedModel))
            {
                modelId = resolvedModel;
            }

            return WorkspaceAiLiveCompletionProbeResult.Ok(deploymentName, modelId, response);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            return WorkspaceAiLiveCompletionProbeResult.TimedOut(
                deploymentName,
                WorkspaceAiAvailabilityProbeLimits.TotalProbeTimeout);
        }
        catch (Exception ex)
        {
            return WorkspaceAiLiveCompletionProbeResult.Failed(
                deploymentName,
                AzureOpenAiVendorProbeErrorFormatter.Format(ex));
        }
    }
}
