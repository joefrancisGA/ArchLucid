namespace ArchLucid.Core.Llm;

/// <summary>Non-secret vendor identity passed to <see cref="ILlmProviderFactory" /> (TB-193).</summary>
public sealed record LlmProviderFactoryDescriptor(
    LlmProviderType ProviderType,
    string ProviderKind,
    string ModelId);
