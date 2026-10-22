using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.ProductLearning;

/// <summary>Artifact-level outcome rollups for trend visualization.</summary>
public sealed class ProductLearningArtifactOutcomeTrendsResponse
{
    public DateTime GeneratedUtc
    {
        get;
        init;
    }

    private IReadOnlyList<ArtifactOutcomeTrend> trends = [];

    public IReadOnlyList<ArtifactOutcomeTrend> Trends
    {
        get => trends;
        init => trends = ContractCollectionDefaults.CoalesceReadOnly(value);
    }
}
