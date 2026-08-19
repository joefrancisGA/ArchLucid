using ArchLucid.Contracts.Findings;

namespace ArchLucid.Core.Findings;

/// <summary>Deterministic insight-density scoring output for one candidate.</summary>
public sealed class InsightDensityGateResult
{
    public int InsightDensityScore
    {
        get;
        init;
    }

    public FindingTreatment Treatment
    {
        get;
        init;
    }

    public FindingClassification Classification
    {
        get;
        init;
    }

    public IReadOnlyList<string> PenaltyReasons
    {
        get;
        init;
    } = [];
}
