namespace ArchLucid.Contracts.Findings.Payloads;

public class PortfolioRecurrenceFindingPayload
{
    public string IdentityToken
    {
        get;
        set;
    } = null!;

    public int SystemCount
    {
        get;
        set;
    }

    public int ScannedSystemCount
    {
        get;
        set;
    }
}
