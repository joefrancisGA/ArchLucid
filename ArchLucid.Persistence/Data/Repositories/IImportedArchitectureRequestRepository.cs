using ArchLucid.Persistence.Models;

namespace ArchLucid.Persistence.Data.Repositories;

public interface IImportedArchitectureRequestRepository
{
    Task InsertAsync(ImportedArchitectureRequestRecord record, CancellationToken cancellationToken = default);
}
