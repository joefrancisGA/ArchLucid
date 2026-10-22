namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>In-memory and test host: prompt variant aggregates are not persisted.</summary>
public sealed class NoOpPromptVariantStatsRepository : IPromptVariantStatsRepository
{
    public Task<IReadOnlyList<PromptVariantStatsRow>> GetStatsByTemplateAsync(
        string promptTemplateName,
        CancellationToken cancellationToken = default)
    {
        _ = promptTemplateName;
        cancellationToken.ThrowIfCancellationRequested();

        return Task.FromResult<IReadOnlyList<PromptVariantStatsRow>>([]);
    }
}
