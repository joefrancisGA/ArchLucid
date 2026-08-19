using ArchLucid.Retrieval.FineTuning.Models;

namespace ArchLucid.Retrieval.FineTuning.Registry;

/// <summary>Versioned per-tenant fine-tuned model registry.</summary>
public interface IFineTunedModelRegistry
{
    Task SaveAsync(FineTunedModelRegistryEntry entry, CancellationToken cancellationToken);

    Task<FineTunedModelRegistryEntry?> TryGetActiveAsync(Guid tenantId, CancellationToken cancellationToken);

    Task RollbackActiveAsync(Guid tenantId, CancellationToken cancellationToken);
}
