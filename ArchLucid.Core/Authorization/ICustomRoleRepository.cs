namespace ArchLucid.Core.Authorization;

public interface ICustomRoleRepository
{
    Task<IReadOnlyList<CustomRoleRecord>> ListByTenantAsync(Guid tenantId, CancellationToken cancellationToken);

    Task<CustomRoleRecord?> TryGetAsync(Guid tenantId, Guid roleId, CancellationToken cancellationToken);

    Task<CustomRoleRecord> CreateAsync(CustomRoleRecord record, CancellationToken cancellationToken);

    Task<CustomRoleRecord> UpdateAsync(CustomRoleRecord record, CancellationToken cancellationToken);

    Task DeleteAsync(Guid tenantId, Guid roleId, CancellationToken cancellationToken);

    Task<IReadOnlyList<CustomRoleAssignmentWithRole>> ListAssignmentsForUserAsync(
        Guid tenantId,
        Guid userId,
        CancellationToken cancellationToken);

    Task AssignAsync(UserCustomRoleAssignmentRecord assignment, CancellationToken cancellationToken);

    Task RemoveAssignmentAsync(Guid tenantId, Guid userId, Guid customRoleId, CancellationToken cancellationToken);

    Task EnsureBuiltInRolesSeededAsync(Guid tenantId, CancellationToken cancellationToken);
}

/// <summary>Assignment row joined with role metadata for claims projection.</summary>
public sealed class CustomRoleAssignmentWithRole
{
    public Guid UserId
    {
        get;
        init;
    }

    public CustomRoleRecord Role
    {
        get;
        init;
    } = null!;
}
