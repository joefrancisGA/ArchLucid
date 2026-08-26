namespace ArchLucid.Contracts.Findings.Payloads;

public class OpenCommitmentFindingPayload
{
    public string SignalKind
    {
        get;
        set;
    } = null!;

    public string SourceFindingId
    {
        get;
        set;
    } = null!;

    public DateTimeOffset DueOrExpiryUtc
    {
        get;
        set;
    }

    public int DaysOverdueOrUntilExpiry
    {
        get;
        set;
    }
}
