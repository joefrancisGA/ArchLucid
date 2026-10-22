using ArchLucid.Persistence.Models;

namespace ArchLucid.Persistence.Interfaces;

/// <summary>Persisted USD/M rates that override <see cref="Core.Configuration.LlmCostEstimationOptions" /> (SQL hosts).</summary>
public interface ILlmCostEstimationUsdRateOverrideRepository
{
    Task<LlmCostEstimationUsdRateOverrideRow?> TryGetAsync(CancellationToken cancellationToken);

    Task UpsertAsync(decimal inputUsdPerMillionTokens, decimal outputUsdPerMillionTokens, string updatedBy,
        CancellationToken cancellationToken);
}
