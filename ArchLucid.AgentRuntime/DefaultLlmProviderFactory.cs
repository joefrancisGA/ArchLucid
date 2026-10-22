using ArchLucid.Core.Llm;

namespace ArchLucid.AgentRuntime;

/// <summary>TB-193 scaffold: routes Azure OpenAI today; other vendors are V2-only.</summary>
public sealed class DefaultLlmProviderFactory : ILlmProviderFactory
{
    private readonly IAgentCompletionClient _defaultCompletionClient;
    private readonly CoreLlmAgentCompletionClientAdapter _adapter;

    public DefaultLlmProviderFactory(IAgentCompletionClient defaultCompletionClient)
    {
        _defaultCompletionClient = defaultCompletionClient
            ?? throw new ArgumentNullException(nameof(defaultCompletionClient));
        _adapter = new CoreLlmAgentCompletionClientAdapter(_defaultCompletionClient);
    }

    public IReadOnlyList<LlmProviderFactoryDescriptor> SupportedProviders =>
        [ToFactoryDescriptor(_defaultCompletionClient.Descriptor)];

    public Core.Llm.IAgentCompletionClient CreateClient(LlmProviderFactoryDescriptor descriptor)
    {
        ArgumentNullException.ThrowIfNull(descriptor);

        if (descriptor.ProviderType != LlmProviderType.AzureOpenAi)
        {
            throw new NotSupportedException(
                $"Provider type '{descriptor.ProviderType}' is not registered. Only Azure OpenAI is available in V1.");
        }

        return _adapter;
    }

    private static LlmProviderFactoryDescriptor ToFactoryDescriptor(LlmProviderDescriptor descriptor)
    {
        ArgumentNullException.ThrowIfNull(descriptor);

        return new LlmProviderFactoryDescriptor(
            descriptor.ProviderType,
            descriptor.ProviderKind,
            descriptor.ModelId);
    }
}
