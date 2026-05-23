namespace ArchLucid.Contracts.Governance.PolicyPacks;

/// <summary>Versioned governance bundle metadata (name, type, lifecycle) scoped to tenant/workspace/project.</summary>
public class PolicyPack
{
    public Guid PolicyPackId
    {
        get;
        set;
    } = Guid.NewGuid();

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

    public string Name
    {
        get;
        set;
    } = null!;

    public string Description
    {
        get;
        set;
    } = null!;

    public string PackType
    {
        get;
        set;
    } = PolicyPackType.BuiltIn;

    public string Status
    {
        get;
        set;
    } = PolicyPackStatus.Draft;

    public DateTime CreatedUtc
    {
        get;
        set;
    } = TimeProvider.System.GetUtcNow().UtcDateTime;

    public DateTime? ActivatedUtc
    {
        get;
        set;
    }

    public string CurrentVersion
    {
        get;
        set;
    } = "1.0.0";

    public bool IsDeleted
    {
        get;
        set;
    }
}
