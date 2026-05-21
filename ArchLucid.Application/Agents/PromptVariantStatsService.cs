using ArchLucid.Contracts.Agents;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Application.Agents;

public sealed class PromptVariantStatsService(IPromptVariantStatsRepository statsRepository) : IPromptVariantStatsService
{
    private readonly IPromptVariantStatsRepository _statsRepository =
        statsRepository ?? throw new ArgumentNullException(nameof(statsRepository));

    public async Task<PromptVariantStatsResponse> GetStatsAsync(
        string promptTemplateName,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(promptTemplateName);

        IReadOnlyList<PromptVariantStatsRow> rows =
            await _statsRepository.GetStatsByTemplateAsync(promptTemplateName.Trim(), cancellationToken);

        List<PromptVariantStatsItem> items = rows
            .Select(r => new PromptVariantStatsItem
            {
                VariantKey = r.VariantKey,
                SampleCount = r.SampleCount,
                MeanSemanticScore = r.MeanSemanticScore,
                MedianSemanticScore = r.MedianSemanticScore,
                QualityGatePassRate = r.QualityGatePassRate
            })
            .ToList();

        return new PromptVariantStatsResponse
        {
            PromptTemplateName = promptTemplateName.Trim(),
            Variants = items
        };
    }
}
