using ArchLucid.Core.Authorization;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>In-memory <see cref="IProjectRoleAssignmentRepository"/> (empty by default).</summary>
public sealed class InMemoryProjectRoleAssignmentRepository : IProjectRoleAssignmentRepository
{
    /// <inheritdoc />
    public Task<ProjectScopedEffectiveRole> GetHighestRoleAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid scimUserId,
        CancellationToken cancellationToken = default) =>
        Task.FromResult(ProjectScopedEffectiveRole.None);
}
