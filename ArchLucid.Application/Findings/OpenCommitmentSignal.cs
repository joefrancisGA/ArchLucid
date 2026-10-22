namespace ArchLucid.Application.Findings;

/// <summary>Pure classification output for one open governance commitment.</summary>
public sealed class OpenCommitmentSignal
{
    public OpenCommitmentSignalKind Kind
    {
        get;
        init;
    }

    public string SourceFindingId
    {
        get;
        init;
    } = null!;

    public DateTimeOffset DueOrExpiryUtc
    {
        get;
        init;
    }

    public string ReasonToken
    {
        get;
        init;
    } = null!;

    public int DaysOverdueOrUntilExpiry
    {
        get;
        init;
    }
}
