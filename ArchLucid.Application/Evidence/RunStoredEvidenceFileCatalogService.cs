using ArchLucid.Contracts.Evidence;
using ArchLucid.Core.Evidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;

namespace ArchLucid.Application.Evidence;

public interface IRunStoredEvidenceFileCatalogService
{
    Task<IReadOnlyList<RunStoredEvidenceFileDto>?> ListForRunAsync(
        Guid runId,
        CancellationToken cancellationToken);
}

public sealed class RunStoredEvidenceFileCatalogService(
    IScopeContextProvider scopeContextProvider,
    IRunRepository runRepository,
    IRunStoredEvidenceFileRepository storedEvidenceFileRepository) : IRunStoredEvidenceFileCatalogService
{
    public async Task<IReadOnlyList<RunStoredEvidenceFileDto>?> ListForRunAsync(
        Guid runId,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = scopeContextProvider.GetCurrentScope();

        if (await runRepository.GetByIdAsync(scope, runId, cancellationToken).ConfigureAwait(false) is null)
        {
            return null;
        }

        IReadOnlyList<RunStoredEvidenceFileRecord> records =
            await storedEvidenceFileRepository.ListByRunAsync(scope, runId, cancellationToken).ConfigureAwait(false);

        return records
            .Select(MapToDto)
            .ToList();
    }

    private static RunStoredEvidenceFileDto MapToDto(RunStoredEvidenceFileRecord record) =>
        new()
        {
            EvidenceItemId = record.EvidenceItemId,
            OriginalFileName = record.OriginalFileName,
            ContentType = record.ContentType,
            ByteLength = record.ByteLength,
            CreatedUtc = record.CreatedUtc,
        };
}
