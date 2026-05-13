namespace ArchLucid.Core.Configuration;

/// <summary>
///     Optional global USD/M input and output rates that override <see cref="LlmCostEstimationOptions" /> when set via
///     admin API (persisted for SQL hosts).
/// </summary>
public interface ILlmCostEstimationUsdRateOverride
{
    /// <summary>When true, replaces host-configured input/output USD-per-million rates before deployment-specific rates apply.</summary>
    bool TryGetUsdPerMillionRates(out decimal inputUsdPerMillionTokens, out decimal outputUsdPerMillionTokens);
}
