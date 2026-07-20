using ArchLucid.Contracts.Advisory.Learning;

namespace ArchLucid.Core.Persistence.Ports;

/// <summary>Persisted recommendation-learning profile row including storage identity.</summary>
public sealed class RecommendationLearningProfileRecord
{
    public Guid ProfileId
    {
        get;
        set;
    }

    public RecommendationLearningProfile Profile
    {
        get;
        set;
    } = new();
}
