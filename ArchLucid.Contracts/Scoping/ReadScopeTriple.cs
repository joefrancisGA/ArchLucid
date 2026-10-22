namespace ArchLucid.Contracts.Scoping;

/// <summary>
///     Tenant/workspace/project triple for scoped repository reads in contract assemblies that cannot reference Core.
/// </summary>
public readonly record struct ReadScopeTriple(Guid TenantId, Guid WorkspaceId, Guid ProjectId)
{
    /// <summary>True when all scope components identify a concrete resource.</summary>
    public bool IsValid => TenantId != Guid.Empty && WorkspaceId != Guid.Empty && ProjectId != Guid.Empty;

    /// <summary>
    ///     Throws at the boundary instead of allowing an empty scope to reach a repository query.
    /// </summary>
    public ReadScopeTriple EnsureValid()
    {
        if (TenantId == Guid.Empty)
        {
            throw new ArgumentException("TenantId must not be empty.", nameof(TenantId));
        }

        if (WorkspaceId == Guid.Empty)
        {
            throw new ArgumentException("WorkspaceId must not be empty.", nameof(WorkspaceId));
        }

        if (ProjectId == Guid.Empty)
        {
            throw new ArgumentException("ProjectId must not be empty.", nameof(ProjectId));
        }

        return this;
    }
}
