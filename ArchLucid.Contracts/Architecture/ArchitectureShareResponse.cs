namespace ArchLucid.Contracts.Architecture;

public sealed class ArchitectureShareResponse
{
    public Guid ArchitectureId
    {
        get;
        set;
    }

    public string ActorOid
    {
        get;
        set;
    } = string.Empty;

    public string Role
    {
        get;
        set;
    } = ArchitectureShareRoles.View;

    public string GrantedBy
    {
        get;
        set;
    } = string.Empty;

    public DateTime GrantedUtc
    {
        get;
        set;
    }

    public string? RowVersionBase64
    {
        get;
        set;
    }
}
