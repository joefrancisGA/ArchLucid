namespace ArchLucid.Contracts.Findings;

public sealed class EngineVerificationConfirmedRatesResponse
{
    public DateTime FromUtc
    {
        get;
        set;
    }

    public DateTime ToUtcExclusive
    {
        get;
        set;
    }

    public IReadOnlyList<EngineVerificationConfirmedRateRow> Rows
    {
        get;
        set;
    } = [];
}
