using System.Collections.Concurrent;

using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Repositories;

/// <summary>In-memory <see cref="IArchitectureVersionRepository" /> for tests and storage mode <c>InMemory</c>.</summary>
public sealed class InMemoryArchitectureVersionRepository : IArchitectureVersionRepository
{
    private readonly ConcurrentDictionary<Guid, ArchitectureVersionRecord> _byId = new();
    // SQL enforces unique (ArchitectureId, VersionNumber) and
    // (ArchitectureId, ContentHashSha256). Serialize the check + insert.
    private readonly Lock _createLock = new();

    public Task<ArchitectureVersionRecord?> GetByContentHashAsync(
        ScopeContext scope,
        Guid architectureId,
        byte[] contentHashSha256,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(contentHashSha256);
        cancellationToken.ThrowIfCancellationRequested();

        ArchitectureVersionRecord? match = _byId.Values.FirstOrDefault(record =>
            record.ArchitectureId == architectureId
            && record.TenantId == scope.TenantId
            && record.WorkspaceId == scope.WorkspaceId
            && record.ScopeProjectId == scope.ProjectId
            && record.ContentHashSha256.SequenceEqual(contentHashSha256));

        return Task.FromResult(match is null ? null : Copy(match));
    }

    public Task<int> GetLatestVersionNumberAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        cancellationToken.ThrowIfCancellationRequested();

        int latest = _byId.Values
            .Where(record =>
                record.ArchitectureId == architectureId
                && record.TenantId == scope.TenantId
                && record.WorkspaceId == scope.WorkspaceId
                && record.ScopeProjectId == scope.ProjectId)
            .Select(static record => record.VersionNumber)
            .DefaultIfEmpty(0)
            .Max();

        return Task.FromResult(latest);
    }

    public Task<ArchitectureVersionRecord> CreateAsync(
        ScopeContext scope,
        ArchitectureVersionRecord record,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(record);
        cancellationToken.ThrowIfCancellationRequested();

        ArchitectureVersionRecord stored = new()
        {
            ArchitectureVersionId = record.ArchitectureVersionId == Guid.Empty
                ? Guid.NewGuid()
                : record.ArchitectureVersionId,
            ArchitectureId = record.ArchitectureId,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            VersionNumber = record.VersionNumber,
            ContentHashSha256 = (byte[])record.ContentHashSha256.Clone(),
            IntakeRequestHashSha256 = record.IntakeRequestHashSha256.Length == 0
                ? (byte[])record.ContentHashSha256.Clone()
                : (byte[])record.IntakeRequestHashSha256.Clone(),
            SourceRequestId = record.SourceRequestId,
            CreatedUtc = record.CreatedUtc == default
                ? TimeProvider.System.GetUtcNow().UtcDateTime
                : record.CreatedUtc,
        };

        lock (_createLock)
        {
            if (_byId.Values.Any(existing =>
                existing.ArchitectureId == stored.ArchitectureId
                && existing.VersionNumber == stored.VersionNumber))
            {
                throw new InvalidOperationException(
                    $"Architecture '{stored.ArchitectureId:D}' already has version number {stored.VersionNumber}.");
            }

            if (_byId.Values.Any(existing =>
                existing.ArchitectureId == stored.ArchitectureId
                && existing.ContentHashSha256.AsSpan().SequenceEqual(stored.ContentHashSha256)))
            {
                throw new InvalidOperationException(
                    $"Architecture '{stored.ArchitectureId:D}' already has this content hash.");
            }

            if (!_byId.TryAdd(stored.ArchitectureVersionId, stored))
                throw new InvalidOperationException(
                    $"Architecture version id '{stored.ArchitectureVersionId:D}' already exists.");
        }

        return Task.FromResult(Copy(stored));
    }

    public Task<ArchitectureVersionRecord?> GetByIdAsync(
        ScopeContext scope,
        Guid architectureVersionId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        cancellationToken.ThrowIfCancellationRequested();

        if (!_byId.TryGetValue(architectureVersionId, out ArchitectureVersionRecord? record))
            return Task.FromResult<ArchitectureVersionRecord?>(null);

        if (record.TenantId != scope.TenantId
            || record.WorkspaceId != scope.WorkspaceId
            || record.ScopeProjectId != scope.ProjectId)
        {
            return Task.FromResult<ArchitectureVersionRecord?>(null);
        }

        return Task.FromResult<ArchitectureVersionRecord?>(Copy(record));
    }

    public Task<ArchitectureVersionRecord?> GetByArchitectureIdAndVersionNumberAsync(
        ScopeContext scope,
        Guid architectureId,
        int versionNumber,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        cancellationToken.ThrowIfCancellationRequested();

        if (architectureId == Guid.Empty || versionNumber < 1)
            return Task.FromResult<ArchitectureVersionRecord?>(null);

        ArchitectureVersionRecord? match = _byId.Values.FirstOrDefault(record =>
            record.ArchitectureId == architectureId
            && record.VersionNumber == versionNumber
            && record.TenantId == scope.TenantId
            && record.WorkspaceId == scope.WorkspaceId
            && record.ScopeProjectId == scope.ProjectId);

        return Task.FromResult(match is null ? null : Copy(match));
    }

    public Task<IReadOnlyList<ArchitectureVersionRecord>> ListByArchitectureIdAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        cancellationToken.ThrowIfCancellationRequested();

        if (architectureId == Guid.Empty)
            return Task.FromResult<IReadOnlyList<ArchitectureVersionRecord>>([]);

        IReadOnlyList<ArchitectureVersionRecord> matches = _byId.Values
            .Where(record =>
                record.ArchitectureId == architectureId
                && record.TenantId == scope.TenantId
                && record.WorkspaceId == scope.WorkspaceId
                && record.ScopeProjectId == scope.ProjectId)
            .OrderByDescending(record => record.VersionNumber)
            .Select(Copy)
            .ToList();

        return Task.FromResult(matches);
    }

    private static ArchitectureVersionRecord Copy(ArchitectureVersionRecord record) =>
        new()
        {
            ArchitectureVersionId = record.ArchitectureVersionId,
            ArchitectureId = record.ArchitectureId,
            TenantId = record.TenantId,
            WorkspaceId = record.WorkspaceId,
            ScopeProjectId = record.ScopeProjectId,
            VersionNumber = record.VersionNumber,
            ContentHashSha256 = (byte[])record.ContentHashSha256.Clone(),
            IntakeRequestHashSha256 = (byte[])record.IntakeRequestHashSha256.Clone(),
            SourceRequestId = record.SourceRequestId,
            CreatedUtc = record.CreatedUtc,
        };
}
