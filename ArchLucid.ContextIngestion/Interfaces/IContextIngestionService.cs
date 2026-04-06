namespace ArchLucid.ContextIngestion.Interfaces;

using Models;

public interface IContextIngestionService
{
    Task<ContextSnapshot> IngestAsync(
        ContextIngestionRequest request,
        CancellationToken ct);
}

