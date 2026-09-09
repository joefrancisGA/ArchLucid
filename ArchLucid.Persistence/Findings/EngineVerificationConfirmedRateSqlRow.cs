namespace ArchLucid.Persistence.Findings;

internal sealed class EngineVerificationConfirmedRateSqlRow
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
}
