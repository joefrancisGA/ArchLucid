using ArchLucid.Core.Configuration;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Persistence.Repositories;

/// <summary>Process-global cache of persisted USD/M rates loaded from SQL at startup and after admin updates.</summary>
public sealed class LlmCostEstimationUsdRateOverrideCache : ILlmCostEstimationUsdRateOverride
{
    private readonly Lock _gate = new();

    private LlmCostEstimationUsdRateOverrideRow? _row;

    /// <inheritdoc />
    public bool TryGetUsdPerMillionRates(out decimal inputUsdPerMillionTokens, out decimal outputUsdPerMillionTokens)
    {
        lock (_gate)
        {
            if (_row is null)
            {
                inputUsdPerMillionTokens = 0;
                outputUsdPerMillionTokens = 0;

                return false;
            }

            inputUsdPerMillionTokens = _row.InputUsdPerMillionTokens;
            outputUsdPerMillionTokens = _row.OutputUsdPerMillionTokens;

            return true;
        }
    }

    /// <summary>Publishes a persisted snapshot from warm-up or an admin update.</summary>
    public void Set(LlmCostEstimationUsdRateOverrideRow? row)
    {
        lock (_gate)
        {
            if (row is null || (_row is not null && row.UpdatedUtc < _row.UpdatedUtc))
                return;

            _row = row;
        }
    }
}
