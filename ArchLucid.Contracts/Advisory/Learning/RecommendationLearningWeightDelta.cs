namespace ArchLucid.Contracts.Advisory.Learning;

/// <summary>Weight comparison row for preview or rebuild impact analysis.</summary>
public sealed class RecommendationLearningWeightDelta
{
    public string FeatureGroup
    {
        get;
        set;
    } = string.Empty;

    public string Feature
    {
        get;
        set;
    } = string.Empty;

    public double CurrentWeight
    {
        get;
        set;
    }

    public double ProposedWeight
    {
        get;
        set;
    }

    public double AbsoluteDelta
    {
        get;
        set;
    }

    public double PercentageDelta
    {
        get;
        set;
    }

    public int ObservationCount
    {
        get;
        set;
    }

    public double Confidence
    {
        get;
        set;
    }

    public bool FallbackUsed
    {
        get;
        set;
    }
}
