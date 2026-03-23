namespace ArchiForge.Contracts.Decisions;

public sealed class DecisionOption
{
    public string OptionId { get; set; } = Guid.NewGuid().ToString("N");

    public string Description { get; set; } = string.Empty;

    public double BaseConfidence
    {
        get; set;
    }

    public double SupportScore
    {
        get; set;
    }

    public double OppositionScore
    {
        get; set;
    }

    public double FinalScore => BaseConfidence + SupportScore - OppositionScore;

    public List<string> EvidenceRefs { get; set; } = [];
}

