namespace ArchLucid.Core.Persistence.ApplicationPorts.Architecture;

public sealed class ArchitectureShareRecord
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
    } = string.Empty;

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

    public byte[]? RowVersion
    {
        get;
        set;
    }
}
