namespace ArchLucid.Contracts.Governance;

/// <summary>JSON for <c>GET /v1/governance/reviews-awaiting-action</c> (TB-263).</summary>
public sealed class GovernanceReviewsAwaitingActionResponse
{
    public IReadOnlyList<GovernanceReviewAwaitingActionItem> Items
    {
        get;
        init;
    } = [];
}

/// <summary>Executed-but-uncommitted recurrence run awaiting operator commit.</summary>
public sealed class GovernanceReviewAwaitingActionItem
{
    public Guid RunId
    {
        get;
        init;
    }

    public string Name
    {
        get;
        init;
    } = string.Empty;

    public DateTimeOffset? ExecutedUtc
    {
        get;
        init;
    }

    public Guid SourceRunId
    {
        get;
        init;
    }

    public int NewFindingCount
    {
        get;
        init;
    }
}
