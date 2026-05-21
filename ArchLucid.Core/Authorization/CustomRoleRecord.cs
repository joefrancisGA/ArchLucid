namespace ArchLucid.Core.Authorization;

/// <summary>Row shape for <c>dbo.CustomRoles</c>.</summary>
public sealed class CustomRoleRecord
{
    public Guid Id
    {
        get;
        init;
    }

    public Guid TenantId
    {
        get;
        init;
    }

    public string Name
    {
        get;
        init;
    } = string.Empty;

    public string? Description
    {
        get;
        init;
    }

    public IReadOnlyList<string> Permissions
    {
        get;
        init;
    } = [];

    public bool IsSystem
    {
        get;
        init;
    }

    public DateTimeOffset CreatedUtc
    {
        get;
        init;
    }

    public DateTimeOffset UpdatedUtc
    {
        get;
        init;
    }
}

/// <summary>Row shape for <c>dbo.UserCustomRoleAssignments</c>.</summary>
public sealed class UserCustomRoleAssignmentRecord
{
    public Guid UserId
    {
        get;
        init;
    }

    public Guid CustomRoleId
    {
        get;
        init;
    }

    public DateTimeOffset AssignedUtc
    {
        get;
        init;
    }

    public string? AssignedByActorId
    {
        get;
        init;
    }
}
