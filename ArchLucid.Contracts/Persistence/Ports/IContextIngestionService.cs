using ArchLucid.Contracts.Persistence.Context;

namespace ArchLucid.Contracts.Persistence.Ports;

public interface IContextIngestionService
{
    Task<ContextSnapshot> IngestAsync(
        ContextIngestionRequest request,
        CancellationToken ct);
}
