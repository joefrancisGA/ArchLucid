namespace ArchLucid.Contracts.Governance.PolicyPacks;

/// <summary>Tenant workspace policy pack row for opt-in/opt-out UI.</summary>
public sealed class PolicyPackWorkspaceSelectionItem
{
    public Guid PolicyPackId
    {
        get;
        set;
    }

    public Guid AssignmentId
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
    } = string.Empty;

    public string PackType
    {
        get;
        set;
    } = null!;

    public string CurrentVersion
    {
        get;
        set;
    } = null!;

    public bool IsEnabled
    {
        get;
        set;
    }

    public bool IsGloballyActive
    {
        get;
        set;
    }

    public bool IsOrganizationRequired
    {
        get;
        set;
    }
}
