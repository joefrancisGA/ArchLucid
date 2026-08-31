namespace ArchLucid.Api.Controllers.Admin;

public sealed class CustomRoleUpsertRequest
{
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

    public IReadOnlyList<string>? Permissions
    {
        get;
        init;
    }
}
