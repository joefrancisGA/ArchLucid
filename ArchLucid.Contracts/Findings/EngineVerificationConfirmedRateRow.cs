namespace ArchLucid.Contracts.Findings;

/// <summary>Per-engine verification confirmed rate for judge-cap ranking (DX-56).</summary>
public sealed class EngineVerificationConfirmedRateRow
{
    public string EngineType
    {
        get;
        set;
    } = null!;

    public int VerifiableDenominator
    {
        get;
        set;
    }

    public int ConfirmedNumerator
    {
        get;
        set;
    }

    /// <summary>(Materialized + Mitigated) / (total − NotVerifiable) when denominator ≥ min sample; otherwise null.</summary>
    public double? ConfirmedRate
    {
        get;
        set;
    }
}
