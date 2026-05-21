using System.Collections.Concurrent;
using System.Text.Json;

using ArchLucid.Core.Authorization;

namespace ArchLucid.Persistence.Authorization;

public sealed class InMemoryCustomRoleRepository : ICustomRoleRepository
{
    private readonly ConcurrentDictionary<(Guid TenantId, Guid RoleId), CustomRoleRecord> _roles = new();
    private readonly ConcurrentDictionary<(Guid UserId, Guid RoleId), UserCustomRoleAssignmentRecord> _assignments = new();

    public Task<IReadOnlyList<CustomRoleRecord>> ListByTenantAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        IReadOnlyList<CustomRoleRecord> rows = _roles.Values
            .Where(r => r.TenantId == tenantId)
            .OrderByDescending(r => r.IsSystem)
            .ThenBy(r => r.Name, StringComparer.OrdinalIgnoreCase)
            .ToList();

        return Task.FromResult(rows);
    }

    public Task<CustomRoleRecord?> TryGetAsync(Guid tenantId, Guid roleId, CancellationToken cancellationToken)
    {
        _roles.TryGetValue((tenantId, roleId), out CustomRoleRecord? record);

        return Task.FromResult(record);
    }

    public Task<CustomRoleRecord> CreateAsync(CustomRoleRecord record, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(record);

        DateTimeOffset now = TimeProvider.System.GetUtcNow();
        CustomRoleRecord stored = new()
        {
            Id = record.Id == Guid.Empty ? Guid.NewGuid() : record.Id,
            TenantId = record.TenantId,
            Name = record.Name,
            Description = record.Description,
            Permissions = record.Permissions.ToList(),
            IsSystem = record.IsSystem,
            CreatedUtc = now,
            UpdatedUtc = now,
        };

        if (!_roles.TryAdd((stored.TenantId, stored.Id), stored))
            throw new InvalidOperationException("Custom role already exists.");

        return Task.FromResult(stored);
    }

    public Task<CustomRoleRecord> UpdateAsync(CustomRoleRecord record, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(record);

        if (!_roles.TryGetValue((record.TenantId, record.Id), out CustomRoleRecord? existing))
            throw new InvalidOperationException("Custom role was not found.");

        if (existing.IsSystem)
            throw new InvalidOperationException("Built-in system roles cannot be updated.");

        CustomRoleRecord updated = new()
        {
            Id = existing.Id,
            TenantId = existing.TenantId,
            Name = record.Name,
            Description = record.Description,
            Permissions = record.Permissions.ToList(),
            IsSystem = false,
            CreatedUtc = existing.CreatedUtc,
            UpdatedUtc = TimeProvider.System.GetUtcNow(),
        };

        _roles[(updated.TenantId, updated.Id)] = updated;

        return Task.FromResult(updated);
    }

    public Task DeleteAsync(Guid tenantId, Guid roleId, CancellationToken cancellationToken)
    {
        if (!_roles.TryGetValue((tenantId, roleId), out CustomRoleRecord? existing))
            throw new InvalidOperationException("Custom role was not found.");

        if (existing.IsSystem)
            throw new InvalidOperationException("Built-in system roles cannot be deleted.");

        _roles.TryRemove((tenantId, roleId), out _);

        foreach ((Guid UserId, Guid RoleId) key in _assignments.Keys.Where(k => k.RoleId == roleId).ToList())
            _assignments.TryRemove(key, out _);

        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<CustomRoleAssignmentWithRole>> ListAssignmentsForUserAsync(
        Guid tenantId,
        Guid userId,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<CustomRoleAssignmentWithRole> rows = _assignments.Values
            .Where(a => a.UserId == userId)
            .Select(a =>
            {
                _roles.TryGetValue((tenantId, a.CustomRoleId), out CustomRoleRecord? role);

                return role is null
                    ? null
                    : new CustomRoleAssignmentWithRole { UserId = userId, Role = role };
            })
            .Where(static r => r is not null)
            .Cast<CustomRoleAssignmentWithRole>()
            .ToList();

        return Task.FromResult(rows);
    }

    public Task AssignAsync(UserCustomRoleAssignmentRecord assignment, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(assignment);

        _assignments[(assignment.UserId, assignment.CustomRoleId)] = assignment;

        return Task.CompletedTask;
    }

    public Task RemoveAssignmentAsync(Guid tenantId, Guid userId, Guid customRoleId, CancellationToken cancellationToken)
    {
        _assignments.TryRemove((userId, customRoleId), out _);

        return Task.CompletedTask;
    }

    public Task EnsureBuiltInRolesSeededAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        IReadOnlyList<(string Name, IReadOnlyList<string> Permissions)> seeds =
        [
            ("Admin", Permissions.BuiltInAdmin),
            ("Operator", Permissions.BuiltInOperator),
            ("Reader", Permissions.BuiltInReader),
            ("Auditor", Permissions.BuiltInAuditor),
        ];

        foreach ((string name, IReadOnlyList<string> permissions) in seeds)
        {
            if (_roles.Values.Any(r => r.TenantId == tenantId && r.IsSystem && r.Name == name))
                continue;

            Guid id = Guid.NewGuid();
            DateTimeOffset now = TimeProvider.System.GetUtcNow();

            _roles[(tenantId, id)] = new CustomRoleRecord
            {
                Id = id,
                TenantId = tenantId,
                Name = name,
                Description = $"Built-in {name} role template.",
                Permissions = permissions.ToList(),
                IsSystem = true,
                CreatedUtc = now,
                UpdatedUtc = now,
            };
        }

        return Task.CompletedTask;
    }
}
