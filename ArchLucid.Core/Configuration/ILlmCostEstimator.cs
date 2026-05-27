namespace ArchLucid.Core.Configuration;

/// <summary>Estimates LLM call cost from token usage and <see cref="LlmCostEstimationOptions" />.</summary>
/// <remarks>
///     Estimates reflect the <strong>currently configured</strong> USD-per-million rates (including live admin overrides via
///     <see cref="ILlmCostEstimationUsdRateOverride" />). Replaying historical token counts after a rate change produces a
///     different USD total — that behavior is intentional and is <strong>not</strong> a stable audit-grade record.
///     Per-trace <see cref="ArchLucid.Contracts.Agents.AgentExecutionTrace.EstimatedCostUsd" /> values captured at recording time may diverge from
///     run-level recomputation via <c>AgentExecutionTraceRunLlmCostAggregator</c>.
///     The OpenTelemetry counter <c>archlucid_llm_cost_usd_total</c> is pre-tax, monitoring-grade (decimal cast to double).
/// </remarks>
public interface ILlmCostEstimator
{
    /// <summary>Returns pre-tax estimated cost, or <see langword="null" /> when estimation is disabled or counts are non-positive.</summary>
    /// <remarks>
    ///     Uses live <see cref="LlmCostEstimationOptions" /> and override rates at call time — not rates frozen at trace persistence.
    ///     See interface-level remarks for replay vs stored-per-trace divergence (TB-023).
    /// </remarks>
    decimal? EstimateUsd(
        int inputTokens,
        int outputTokens,
        int reasoningTokens = 0,
        string? deploymentLabel = null);
}
