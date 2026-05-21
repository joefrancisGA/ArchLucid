using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;

using ArchLucid.Application.Common;

namespace ArchLucid.Application.Authorization;

public interface ICustomRoleService
{
    Task<IReadOnlyList<CustomRoleRecord>> ListAsync(CancellationToken cancellationToken);

    Task<CustomRoleRecord> CreateAsync(string name, string? description, IReadOnlyList<string> permissions, CancellationToken cancellationToken);

    Task<CustomRoleRecord> UpdateAsync(Guid roleId, string name, string? description, IReadOnlyList<string> permissions, CancellationToken cancellationToken);

    Task DeleteAsync(Guid roleId, CancellationToken cancellationToken);

    Task AssignAsync(Guid roleId, Guid userId, CancellationToken cancellationToken);
}

public sealed class CustomRoleService(
    ICustomRoleRepository repository,
    IScopeContextProvider scopeProvider,
    IActorContext actorContext) : ICustomRoleService
{
    private readonly ICustomRoleRepository _repository =
        repository ?? throw new ArgumentNullException(nameof(repository));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    private readonly IActorContext _actorContext =
        actorContext ?? throw new ArgumentNullException(nameof(actorContext));

    public async Task<IReadOnlyList<CustomRoleRecord>> ListAsync(CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        await _repository.EnsureBuiltInRolesSeededAsync(scope.TenantId, cancellationToken);

        return await _repository.ListByTenantAsync(scope.TenantId, cancellationToken);
    }

    public async Task<CustomRoleRecord> CreateAsync(
        string name,
        string? description,
        IReadOnlyList<string> permissions,
        CancellationToken cancellationToken)
    {
        ValidateName(name);
        IReadOnlyList<string> normalized = Permissions.ValidateAndNormalize(permissions);
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        CustomRoleRecord record = new()
        {
            Id = Guid.NewGuid(),
            TenantId = scope.TenantId,
            Name = name.Trim(),
            Description = description?.Trim(),
            Permissions = normalized,
            IsSystem = false,
        };

        return await _repository.CreateAsync(record, cancellationToken);
    }

    public async Task<CustomRoleRecord> UpdateAsync(
        Guid roleId,
        string name,
        string? description,
        IReadOnlyList<string> permissions,
        CancellationToken cancellationToken)
    {
        ValidateName(name);
        IReadOnlyList<string> normalized = Permissions.ValidateAndNormalize(permissions);
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        CustomRoleRecord? existing = await _repository.TryGetAsync(scope.TenantId, roleId, cancellationToken);

        if (existing is null)
            throw new KeyNotFoundException("Custom role was not found.");

        CustomRoleRecord updated = new()
        {
            Id = existing.Id,
            TenantId = existing.TenantId,
            Name = name.Trim(),
            Description = description?.Trim(),
            Permissions = normalized,
            IsSystem = false,
            CreatedUtc = existing.CreatedUtc,
            UpdatedUtc = TimeProvider.System.GetUtcNow(),
        };

        return await _repository.UpdateAsync(updated, cancellationToken);
    }

    public async Task DeleteAsync(Guid roleId, CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        await _repository.DeleteAsync(scope.TenantId, roleId, cancellationToken);
    }

    public async Task AssignAsync(Guid roleId, Guid userId, CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        CustomRoleRecord? role = await _repository.TryGetAsync(scope.TenantId, roleId, cancellationToken);

        if (role is null)
            throw new KeyNotFoundException("Custom role was not found.");

        UserCustomRoleAssignmentRecord assignment = new()
        {
            UserId = userId,
            CustomRoleId = roleId,
            AssignedUtc = TimeProvider.System.GetUtcNow(),
            AssignedByActorId = _actorContext.GetActorId(),
        };

        await _repository.AssignAsync(assignment, cancellationToken);
    }

    private static void ValidateName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Role name is required.", nameof(name));

        if (name.Trim().Length > 128)
            throw new ArgumentException("Role name must be 128 characters or fewer.", nameof(name));
    }
}

public interface ICustomRolePermissionEvaluator
{
    Task<IReadOnlyList<string>> GetEffectivePermissionsAsync(
        Guid tenantId,
        Guid userId,
        CancellationToken cancellationToken);
}

public sealed class CustomRolePermissionEvaluator(ICustomRoleRepository repository) : ICustomRolePermissionEvaluator
{
    private readonly ICustomRoleRepository _repository =
        repository ?? throw new ArgumentNullException(nameof(repository));

    public async Task<IReadOnlyList<string>> GetEffectivePermissionsAsync(
        Guid tenantId,
        Guid userId,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<CustomRoleAssignmentWithRole> assignments =
            await _repository.ListAssignmentsForUserAsync(tenantId, userId, cancellationToken);

        HashSet<string> permissions = new(StringComparer.Ordinal);

        foreach (CustomRoleAssignmentWithRole assignment in assignments)
        {
            foreach (string permission in assignment.Role.Permissions)
                permissions.Add(permission);
        }

        return permissions.ToList();
    }
}
