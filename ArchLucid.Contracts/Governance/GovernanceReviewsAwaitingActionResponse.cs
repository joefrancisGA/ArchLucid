using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Governance;

/// <summary>JSON for <c>GET /v1/governance/reviews-awaiting-action</c> (TB-263).</summary>
public sealed class GovernanceReviewsAwaitingActionResponse
{
    private IReadOnlyList<GovernanceReviewAwaitingActionItem> items = [];

    public IReadOnlyList<GovernanceReviewAwaitingActionItem> Items
    {
        get => items;
        init => items = ContractCollectionDefaults.CoalesceReadOnly(value);
    }
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
