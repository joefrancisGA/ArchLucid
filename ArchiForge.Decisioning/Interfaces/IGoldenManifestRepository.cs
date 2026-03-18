using ArchiForge.Decisioning.Models;

namespace ArchiForge.Decisioning.Interfaces;

public interface IGoldenManifestRepository
{
    Task SaveAsync(GoldenManifest manifest, CancellationToken ct);
    Task<GoldenManifest?> GetByIdAsync(Guid manifestId, CancellationToken ct);
}

