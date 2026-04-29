using ArchLucid.Persistence.Models;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>In-memory hosts: import drafts are not persisted to SQL.</summary>
public sealed class NoOpImportedArchitectureRequestRepository : IImportedArchitectureRequestRepository
{
    public Task InsertAsync(ImportedArchitectureRequestRecord record, CancellationToken cancellationToken = default)
        => Task.CompletedTask;
}
