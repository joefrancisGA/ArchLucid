using ArchLucid.Core.Authorization;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>Reads <c>dbo.ProjectRoleAssignments</c> for SCIM-linked directory users.</summary>
public interface IProjectRoleAssignmentRepository
{
    Task<ProjectScopedEffectiveRole> GetHighestRoleAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid scimUserId,
        CancellationToken cancellationToken = default);
}
