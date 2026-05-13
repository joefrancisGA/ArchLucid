using ArchLucid.Core.Configuration;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Persistence.Repositories;

/// <summary>Process-global cache of persisted USD/M rates loaded from SQL at startup and after admin updates.</summary>
public sealed class LlmCostEstimationUsdRateOverrideCache : ILlmCostEstimationUsdRateOverride
{
    private readonly object _gate = new();

    private LlmCostEstimationUsdRateOverrideRow? _row;

    /// <inheritdoc />
    public bool TryGetUsdPerMillionRates(out decimal inputUsdPerMillionTokens, out decimal outputUsdPerMillionTokens)
    {
        lock (_gate)
        {
            if (_row is null)
            {
                inputUsdPerMillionTokens = default;
                outputUsdPerMillionTokens = default;

                return false;
            }

            inputUsdPerMillionTokens = _row.InputUsdPerMillionTokens;
            outputUsdPerMillionTokens = _row.OutputUsdPerMillionTokens;

            return true;
        }
    }

    /// <summary>Replaces the in-memory snapshot (e.g. after warm-up or admin POST).</summary>
    public void Set(LlmCostEstimationUsdRateOverrideRow? row)
    {
        lock (_gate)
        {
            _row = row;
        }
    }
}
