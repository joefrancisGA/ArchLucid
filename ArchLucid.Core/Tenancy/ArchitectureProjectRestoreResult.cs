namespace ArchLucid.Core.Tenancy;

/// <summary>Outcome of restoring a soft-deleted <c>dbo.Projects</c> row (<c>IsDeleted</c> 1→0).</summary>
public enum ArchitectureProjectRestoreResult
{
    /// <summary>Row was restored successfully.</summary>
    Restored,

    /// <summary>No matching soft-deleted row for tenant / workspace / project id.</summary>
    NotFoundOrNotDeleted,

    /// <summary>Another active project in the same workspace already occupies the restored name (<c>UX_Projects_Workspace_Name_Active2</c>).</summary>
    ActiveProjectNameCollision
}
