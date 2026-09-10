namespace ArchLucid.Contracts.Architecture;

public sealed class PutArchitectureShareRequest
{
    /// <summary>Entra user oid key (jwt:tid:oid). SCIM group ids are rejected (AS-096).</summary>
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
}
