namespace ArchLucid.Core.Scoping;

/// <summary>Validated project authority and snapshot identity for snapshot-scoped reads.</summary>
public sealed record ProjectSnapshotScopeKey
{
    private ProjectSnapshotScopeKey(ProjectScopeKey project, Guid snapshotId)
    {
        Project = project;
        SnapshotId = snapshotId;
    }

    public ProjectScopeKey Project { get; }
    public Guid TenantId => Project.TenantId;
    public Guid WorkspaceId => Project.WorkspaceId;
    public Guid ProjectId => Project.ProjectId;
    public Guid SnapshotId { get; }

    public static ProjectSnapshotScopeKey Create(ProjectScopeKey project, Guid snapshotId)
    {
        ArgumentNullException.ThrowIfNull(project);
        if (snapshotId == Guid.Empty)
            throw new ArgumentException("Snapshot id must not be empty.", nameof(snapshotId));
        return new ProjectSnapshotScopeKey(project, snapshotId);
    }
}
