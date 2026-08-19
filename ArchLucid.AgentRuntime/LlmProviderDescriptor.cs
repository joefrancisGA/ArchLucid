using ArchLucid.Core.Llm;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Non-secret connection surface for an <see cref="ILlmProvider" /> implementation: vendor kind, model/deployment id,
///     API base URL, and auth scheme.
///     Enables multi-vendor registration (Anthropic, Bedrock, Ollama, etc.) without changing agent handlers.
/// </summary>
public sealed record LlmProviderDescriptor(
    string ProviderKind,
    string ModelId,
    Uri? ApiBaseUri,
    LlmProviderAuthScheme AuthScheme)
{
    /// <summary>Vendor enum for factory routing (TB-193).</summary>
    public LlmProviderType ProviderType => MapProviderType(ProviderKind);

    private static LlmProviderType MapProviderType(string providerKind)
    {
        if (string.Equals(providerKind, "azure-openai", StringComparison.OrdinalIgnoreCase))
            return LlmProviderType.AzureOpenAi;

        if (string.Equals(providerKind, "anthropic", StringComparison.OrdinalIgnoreCase))
            return LlmProviderType.Anthropic;

        if (string.Equals(providerKind, "openai-compatible", StringComparison.OrdinalIgnoreCase))
            return LlmProviderType.LocalOllama;

        if (string.Equals(providerKind, "bedrock", StringComparison.OrdinalIgnoreCase))
            return LlmProviderType.GoogleGemini;

        return LlmProviderType.Unknown;
    }

    /// <summary>Azure OpenAI–compatible resource base URL and chat deployment name.</summary>
    public static LlmProviderDescriptor ForAzureOpenAi(Uri apiBase, string deploymentOrModelId)
    {
        ArgumentNullException.ThrowIfNull(apiBase);
        ArgumentException.ThrowIfNullOrWhiteSpace(deploymentOrModelId);

        return new LlmProviderDescriptor(
            "azure-openai",
            deploymentOrModelId.Trim(),
            apiBase,
            LlmProviderAuthScheme.ApiKey);
    }

    /// <summary>
    ///     Placeholder for Anthropic Messages API–style providers (implementations supply real
    ///     <paramref name="apiBase" />).
    /// </summary>
    public static LlmProviderDescriptor ForAnthropic(Uri apiBase, string modelId)
    {
        ArgumentNullException.ThrowIfNull(apiBase);
        ArgumentException.ThrowIfNullOrWhiteSpace(modelId);

        return new LlmProviderDescriptor(
            "anthropic",
            modelId.Trim(),
            apiBase,
            LlmProviderAuthScheme.ApiKey);
    }

    /// <summary>Placeholder for Amazon Bedrock–style SigV4 endpoints.</summary>
    public static LlmProviderDescriptor ForBedrock(Uri apiBase, string modelId)
    {
        ArgumentNullException.ThrowIfNull(apiBase);
        ArgumentException.ThrowIfNullOrWhiteSpace(modelId);

        return new LlmProviderDescriptor(
            "bedrock",
            modelId.Trim(),
            apiBase,
            LlmProviderAuthScheme.AwsSigV4);
    }

    /// <summary>Local or OpenAI-compatible HTTP servers (Ollama, vLLM, etc.).</summary>
    public static LlmProviderDescriptor ForOpenAiCompatible(Uri apiBase, string modelId,
        LlmProviderAuthScheme authScheme)
    {
        ArgumentNullException.ThrowIfNull(apiBase);
        ArgumentException.ThrowIfNullOrWhiteSpace(modelId);

        return new LlmProviderDescriptor(
            "openai-compatible",
            modelId.Trim(),
            apiBase,
            authScheme);
    }

    /// <summary>Echo, fake completion, or other non-network providers.</summary>
    public static LlmProviderDescriptor ForOffline(string providerKind, string modelId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(providerKind);
        ArgumentException.ThrowIfNullOrWhiteSpace(modelId);

        return new LlmProviderDescriptor(providerKind.Trim(), modelId.Trim(), null, LlmProviderAuthScheme.None);
    }
}
