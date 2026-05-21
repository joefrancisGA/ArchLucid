using ArchLucid.Contracts.Agents.PromptVariants;

namespace ArchLucid.AgentRuntime.Prompts.Variants;

/// <summary>Weighted cumulative selection over active variants (basis points sum to 10000).</summary>
public sealed class PromptVariantSelector(IPromptVariantRegistry registry) : IPromptVariantSelector
{
    private readonly IPromptVariantRegistry _registry =
        registry ?? throw new ArgumentNullException(nameof(registry));

    /// <inheritdoc />
    public async Task<PromptVariantSelection?> TrySelectAsync(
        string promptTemplateName,
        Guid tenantId,
        Guid runId,
        string builtInPromptText,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(promptTemplateName);
        ArgumentException.ThrowIfNullOrWhiteSpace(builtInPromptText);

        IReadOnlyList<PromptVariantRecord> variants =
            await _registry.GetActiveVariantsAsync(promptTemplateName, cancellationToken);

        if (variants.Count == 0)
            return null;

        int totalWeight = variants.Sum(v => v.WeightBps);

        if (totalWeight != 10000)
        {
            throw new InvalidOperationException(
                $"Prompt template '{promptTemplateName}' has active variants whose WeightBps sum to {totalWeight}, expected 10000.");
        }

        int bucket = PromptVariantBucketHasher.ComputeBucket(tenantId, runId, promptTemplateName);
        int cumulative = 0;
        PromptVariantRecord? chosen = null;

        foreach (PromptVariantRecord variant in variants)
        {
            cumulative += variant.WeightBps;

            if (bucket < cumulative)
            {
                chosen = variant;
                break;
            }
        }

        chosen ??= variants[^1];

        string body = string.IsNullOrWhiteSpace(chosen.PromptBody) ? builtInPromptText : chosen.PromptBody;

        return new PromptVariantSelection
        {
            PromptTemplateName = promptTemplateName,
            VariantKey = chosen.VariantKey,
            PromptBody = body
        };
    }
}
