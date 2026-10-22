using ArchLucid.Core.Authorization;

namespace ArchLucid.Api.Controllers.Admin;

public sealed class CustomRoleResponse
{
    public Guid Id
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

    public DateTimeOffset UpdatedUtc
    {
        get;
        init;
    }

    public static CustomRoleResponse FromRecord(CustomRoleRecord record)
    {
        return new CustomRoleResponse
        {
            Id = record.Id,
            Name = record.Name,
            Description = record.Description,
            Permissions = record.Permissions,
            IsSystem = record.IsSystem,
            UpdatedUtc = record.UpdatedUtc,
        };
    }
}
