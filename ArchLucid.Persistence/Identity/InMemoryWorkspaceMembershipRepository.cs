using System.Collections.Concurrent;

using ArchLucid.Core.Authorization;
using ArchLucid.Core.Identity;

namespace ArchLucid.Persistence.Identity;

public sealed class InMemoryWorkspaceMembershipRepository : IWorkspaceMembershipRepository
{
    private readonly ConcurrentDictionary<(Guid UserId, Guid WorkspaceId), WorkspaceMembershipRecord> _byKey = new();

    public Task<IReadOnlyList<WorkspaceMembershipRecord>> ListByUserIdAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        IReadOnlyList<WorkspaceMembershipRecord> rows =
            _byKey.Values.Where(row => row.UserId == userId).OrderBy(row => row.CreatedUtc).ToList();

        return Task.FromResult(rows);
    }

    public Task<IReadOnlyList<WorkspaceMembershipRecord>> ListByUserAndTenantAsync(
        Guid userId,
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        IReadOnlyList<WorkspaceMembershipRecord> rows =
            _byKey.Values
                .Where(row => row.UserId == userId && row.TenantId == tenantId)
                .OrderBy(row => row.CreatedUtc)
                .ToList();

        return Task.FromResult(rows);
    }

    public Task UpsertAsync(WorkspaceMembershipInsert insert, DateTimeOffset updatedUtc, CancellationToken cancellationToken)
    {
        _ = cancellationToken;
        ArgumentNullException.ThrowIfNull(insert);

        (Guid UserId, Guid WorkspaceId) key = (insert.UserId, insert.WorkspaceId);

        if (_byKey.TryGetValue(key, out WorkspaceMembershipRecord? existing))
        {
            WorkspaceMembershipRecord updated = new()
            {
                UserId = existing.UserId,
                TenantId = insert.TenantId,
                WorkspaceId = existing.WorkspaceId,
                Role = insert.Role,
                Status = insert.Status,
                CreatedUtc = existing.CreatedUtc,
                UpdatedUtc = updatedUtc
            };

            _byKey[key] = updated;

            return Task.CompletedTask;
        }

        WorkspaceMembershipRecord created = new()
        {
            UserId = insert.UserId,
            TenantId = insert.TenantId,
            WorkspaceId = insert.WorkspaceId,
            Role = insert.Role,
            Status = insert.Status,
            CreatedUtc = updatedUtc,
            UpdatedUtc = updatedUtc
        };

        _byKey[key] = created;

        return Task.CompletedTask;
    }

    public Task<int> CountActivePrivilegedMembersByTenantAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        HashSet<Guid> privilegedUsers = _byKey.Values
            .Where(row =>
                row.TenantId == tenantId
                && row.Status == WorkspaceMembershipStatus.Active
                && (string.Equals(row.Role, ArchLucidRoles.WorkspaceAdmin, StringComparison.Ordinal)
                    || string.Equals(row.Role, ArchLucidRoles.Admin, StringComparison.Ordinal)))
            .Select(row => row.UserId)
            .ToHashSet();

        int count = privilegedUsers.Count;

        return Task.FromResult(count);
    }
}
