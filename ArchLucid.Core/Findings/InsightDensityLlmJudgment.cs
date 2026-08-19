namespace ArchLucid.Core.Findings;

/// <summary>Parsed Premium-tier judgment for one promoted finding candidate.</summary>
public sealed class InsightDensityLlmJudgment
{
    public string FindingId
    {
        get;
        init;
    } = string.Empty;

    public int InsightDensityScore
    {
        get;
        init;
    }

    public string? WhyThisIsNotGeneric
    {
        get;
        init;
    }

    public string? PrincipalArchitectValue
    {
        get;
        init;
    }

    public string? DecisionConsequence
    {
        get;
        init;
    }

    public bool DemoteToChecklist
    {
        get;
        init;
    }

    public IReadOnlyList<string> EvidenceRefs
    {
        get;
        init;
    } = [];
}
