namespace ArchLucid.Core.Llm;

/// <summary>Creates <see cref="IAgentCompletionClient" /> instances from vendor descriptors (TB-193).</summary>
public interface ILlmProviderFactory
{
    IReadOnlyList<LlmProviderFactoryDescriptor> SupportedProviders
    {
        get;
    }

    IAgentCompletionClient CreateClient(LlmProviderFactoryDescriptor descriptor);
}
