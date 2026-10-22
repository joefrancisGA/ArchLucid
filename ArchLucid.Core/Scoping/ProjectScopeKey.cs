namespace ArchLucid.Core.Scoping;

/// <summary>
///     Validated tenant/workspace/project authority key for project-scoped reads and mutations.
///     Use a distinct tenant-only API for deliberately tenant-global operations.
/// </summary>
public sealed record ProjectScopeKey
{
    private ProjectScopeKey(Guid tenantId, Guid workspaceId, Guid projectId)
    {
        TenantId = tenantId;
        WorkspaceId = workspaceId;
        ProjectId = projectId;
    }

    public Guid TenantId { get; }

    public Guid WorkspaceId { get; }

    public Guid ProjectId { get; }

    public static ProjectScopeKey Create(Guid tenantId, Guid workspaceId, Guid projectId)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("Tenant id must not be empty.", nameof(tenantId));

        if (workspaceId == Guid.Empty)
            throw new ArgumentException("Workspace id must not be empty.", nameof(workspaceId));

        if (projectId == Guid.Empty)
            throw new ArgumentException("Project id must not be empty.", nameof(projectId));

        return new ProjectScopeKey(tenantId, workspaceId, projectId);
    }

    public static ProjectScopeKey From(ScopeContext scope)
    {
        ArgumentNullException.ThrowIfNull(scope);
        return Create(scope.TenantId, scope.WorkspaceId, scope.ProjectId);
    }

    public bool Matches(Guid tenantId, Guid workspaceId, Guid projectId) =>
        TenantId == tenantId
        && WorkspaceId == workspaceId
        && ProjectId == projectId;
}
