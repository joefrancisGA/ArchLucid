namespace ArchLucid.Contracts.Governance;

/// <summary>Optional filters for the architecture decision register (TB-060).</summary>
public sealed class ArchitectureDecisionRegisterQueryOptions
{
    public string? Category
    {
        get;
        init;
    }

    public DateTimeOffset? RecordedAfterUtc
    {
        get;
        init;
    }

    public DateTimeOffset? RecordedBeforeUtc
    {
        get;
        init;
    }

    public double? MinConfidence
    {
        get;
        init;
    }

    public double? MaxConfidence
    {
        get;
        init;
    }

    public string? BuyerConfidenceSource
    {
        get;
        init;
    }
}
