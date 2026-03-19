using ArchiForge.Persistence.Models;

namespace ArchiForge.Persistence.Interfaces;

public interface IRunRepository
{
    Task SaveAsync(RunRecord run, CancellationToken ct);
    Task<RunRecord?> GetByIdAsync(Guid runId, CancellationToken ct);
    Task UpdateAsync(RunRecord run, CancellationToken ct);
}
