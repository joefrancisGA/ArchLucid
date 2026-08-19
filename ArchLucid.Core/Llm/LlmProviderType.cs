namespace ArchLucid.Core.Llm;

/// <summary>Logical LLM vendor for <see cref="ILlmProviderFactory" /> (TB-193 scaffold).</summary>
public enum LlmProviderType
{
    Unknown = 0,
    AzureOpenAi = 1,
    Anthropic = 2,
    GoogleGemini = 3,
    LocalOllama = 4
}
