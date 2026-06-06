namespace ArchLucid.Core.Scoping;

/// <summary>
///     Identifies how a scope dimension was resolved at the host boundary (TB-304).
/// </summary>
public enum ScopeSource
{
    /// <summary>Explicit <see cref="AmbientScopeContext" /> override (background jobs).</summary>
    Ambient,

    /// <summary>JWT or API-key <c>tenant_id</c> / <c>workspace_id</c> / <c>project_id</c> claim.</summary>
    Claim,

    /// <summary><c>x-tenant-id</c> / <c>x-workspace-id</c> / <c>x-project-id</c> HTTP header.</summary>
    Header,

    /// <summary>Well-known <see cref="ScopeIds" /> development default.</summary>
    Default,
}
