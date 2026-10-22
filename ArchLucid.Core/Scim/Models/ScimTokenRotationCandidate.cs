namespace ArchLucid.Core.Scim.Models;

/// <summary>Active SCIM bearer token ageing input for rotation reminder job (token id only — no secrets).</summary>
/// <remarks>
/// Property-bag class (not a positional record) so Dapper can materialize SQL rows via parameterless construction.
/// </remarks>
public sealed class ScimTokenRotationCandidate
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

    public DateTimeOffset CreatedUtc
    {
        get;
        init;
    }
}
