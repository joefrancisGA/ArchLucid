using ArchLucid.Contracts.Agents.PromptVariants;

namespace ArchLucid.AgentRuntime.Prompts.Variants;

/// <summary>Selects a prompt variant by stable weighted hash bucket.</summary>
public interface IPromptVariantSelector
{
    /// <summary>
    ///     Returns a variant for <paramref name="promptTemplateName" /> when variants are configured; otherwise
    ///     <see langword="null" />.
    /// </summary>
    Task<PromptVariantSelection?> TrySelectAsync(
        string promptTemplateName,
        Guid tenantId,
        Guid runId,
        string builtInPromptText,
        CancellationToken cancellationToken = default);
}
