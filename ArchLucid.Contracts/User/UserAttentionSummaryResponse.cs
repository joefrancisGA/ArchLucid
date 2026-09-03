namespace ArchLucid.Contracts.User;

/// <summary>Authoritative attention counts for nav badges and Overview (TB-2369 server rollup).</summary>
public sealed class UserAttentionSummaryResponse
{
    public int AssignedToMeFindingsCount
    {
        get;
        set;
    }

    public int AwaitingApprovalCount
    {
        get;
        set;
    }

    public int AlertsOpenCount
    {
        get;
        set;
    }

    public DateTimeOffset CheckedAtUtc
    {
        get;
        set;
    }
}
