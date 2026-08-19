namespace ArchLucid.Contracts.Admin;

public sealed class AdminTenantHealthSummaryItem
{
    public Guid TenantId
    {
        get;
        set;
    }

    public Guid WorkspaceId
    {
        get;
        set;
    }

    public Guid ProjectId
    {
        get;
        set;
    }

    public decimal EngagementScore
    {
        get;
        set;
    }

    public decimal GovernanceScore
    {
        get;
        set;
    }

    public string PilotFunnelStage
    {
        get;
        set;
    } = "";

    public int RunsLast7d
    {
        get;
        set;
    }

    public int CommitsLast7d
    {
        get;
        set;
    }

    public DateTimeOffset? LastActivityUtc
    {
        get;
        set;
    }
}
