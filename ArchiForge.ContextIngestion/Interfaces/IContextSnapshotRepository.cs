namespace ArchiForge.ContextIngestion.Interfaces;

using ArchiForge.ContextIngestion.Models;

public interface IContextSnapshotRepository
{
    Task<ContextSnapshot?> GetLatestAsync(string projectId, CancellationToken ct);

    Task SaveAsync(ContextSnapshot snapshot, CancellationToken ct);
}

