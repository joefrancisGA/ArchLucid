using ArchLucid.ContextIngestion.Models;

namespace ArchLucid.ContextIngestion.Interfaces;

public interface IContextIngestionService
{
    Task<ContextSnapshot> IngestAsync(
        ContextIngestionRequest request,
        CancellationToken ct);
}
