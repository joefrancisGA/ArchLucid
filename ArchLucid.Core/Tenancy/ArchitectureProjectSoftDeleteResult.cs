namespace ArchLucid.Core.Tenancy;

/// <summary>Outcome of soft-deleting a <c>dbo.Projects</c> row (<c>IsDeleted</c> 0→1).</summary>
public enum ArchitectureProjectSoftDeleteResult
{
    /// <summary>Row was soft-deleted successfully.</summary>
    Deleted,

    /// <summary>Project was already soft-deleted (idempotent operator retry).</summary>
    AlreadyDeleted,

    /// <summary>No matching active project for tenant / workspace / project id.</summary>
    NotFound,
}
