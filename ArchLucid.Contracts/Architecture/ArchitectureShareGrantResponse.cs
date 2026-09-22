namespace ArchLucid.Contracts.Architecture;

public sealed class ArchitectureShareGrantResponse
{
    public Guid UserId
    {
        get;
        set;
    }

    public string Role
    {
        get;
        set;
    } = "View";

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
}
