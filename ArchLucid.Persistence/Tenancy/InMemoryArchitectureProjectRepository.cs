using System.Collections.Concurrent;

using ArchLucid.Core.Tenancy;

namespace ArchLucid.Persistence.Tenancy;

/// <summary>In-memory <see cref="IArchitectureProjectRepository" /> for tests and storage mode <c>InMemory</c>.</summary>
public sealed class InMemoryArchitectureProjectRepository : IArchitectureProjectRepository
{
    private readonly ConcurrentDictionary<Guid, ProjectRow> _byId = new();

    /// <inheritdoc />
    public Task InsertAsync(Guid id, Guid tenantId, Guid workspaceId, string name, CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        _ = ct;

        string trimmed = name.Trim();
        DateTimeOffset now = TimeProvider.System.GetUtcNow();

        return !_byId.TryAdd(
            id,
            new ProjectRow
            {
                Id = id,
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                Name = trimmed,
                CreatedUtc = now,
                IsDeleted = false
            }) ? throw new InvalidOperationException($"Architecture project id '{id:D}' already exists.") : Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<ArchitectureProjectRecord>> ListActiveByTenantAsync(Guid tenantId, CancellationToken ct)
    {
        _ = ct;

        IReadOnlyList<ArchitectureProjectRecord> list = _byId.Values
            .Where(r => !r.IsDeleted && r.TenantId == tenantId)
            .OrderBy(static r => r.WorkspaceId)
            .ThenBy(static r => r.Name, StringComparer.OrdinalIgnoreCase)
            .Select(static r => new ArchitectureProjectRecord
            {
                Id = r.Id,
                TenantId = r.TenantId,
                WorkspaceId = r.WorkspaceId,
                Name = r.Name,
                CreatedUtc = r.CreatedUtc
            })
            .ToList();

        return Task.FromResult(list);
    }

    /// <inheritdoc />
    public Task<bool> TrySoftDeleteAsync(Guid tenantId, Guid workspaceId, Guid projectId, CancellationToken ct)
    {
        _ = ct;

        if (!_byId.TryGetValue(projectId, out ProjectRow? row) || row.TenantId != tenantId || row.WorkspaceId != workspaceId || row.IsDeleted)
            return Task.FromResult(false);

        row.IsDeleted = true;

        return Task.FromResult(true);
    }

    private sealed class ProjectRow
    {
        public Guid Id
        {
            get;
            init;
        }

        public Guid TenantId
        {
            get;
            init;
        }

        public Guid WorkspaceId
        {
            get;
            init;
        }

        public string Name
        {
            get;
            init;
        } = string.Empty;

        public DateTimeOffset CreatedUtc
        {
            get;
            init;
        }

        public bool IsDeleted
        {
            get;
            set;
        }
    }
}
