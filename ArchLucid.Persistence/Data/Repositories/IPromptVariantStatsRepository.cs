namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>Aggregated prompt variant quality metrics from <c>dbo.AgentOutputEvaluations</c>.</summary>
public interface IPromptVariantStatsRepository
{
    Task<IReadOnlyList<PromptVariantStatsRow>> GetStatsByTemplateAsync(
        string promptTemplateName,
        CancellationToken cancellationToken = default);
}

public sealed class PromptVariantStatsRow
{
    public required string VariantKey
    {
        get;
        init;
    }

    public int SampleCount
    {
        get;
        init;
    }

    public double MeanSemanticScore
    {
        get;
        init;
    }

    public double MedianSemanticScore
    {
        get;
        init;
    }

    public double QualityGatePassRate
    {
        get;
        init;
    }
}
