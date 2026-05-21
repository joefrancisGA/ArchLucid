namespace ArchLucid.Contracts.Agents.PromptVariants;

/// <summary>Loads active prompt variants from <c>dbo.PromptVariants</c>.</summary>
public interface IPromptVariantRegistry
{
    Task<IReadOnlyList<PromptVariantRecord>> GetActiveVariantsAsync(
        string promptTemplateName,
        CancellationToken cancellationToken = default);
}
