namespace ArchiForge.ContextIngestion.Interfaces;

using ArchiForge.ContextIngestion.Models;

public interface IContextIngestionService
{
    Task<ContextSnapshot> IngestAsync(
        ContextIngestionRequest request,
        CancellationToken ct);
}

