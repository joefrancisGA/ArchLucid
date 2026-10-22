using System.Collections.Concurrent;
using System.Diagnostics;
using System.Diagnostics.Metrics;
using System.Globalization;

namespace ArchLucid.Core.Diagnostics;

/// <summary>Prepaid LLM wallet telemetry: Stripe refills and per-tenant balance gauge (TB-014).</summary>
/// <remarks>
///     Balances are held in a dictionary rather than an <c>UpDownCounter</c> because the gauge must report the current
///     balance per tenant on each OTel collection, and refunds/expiry can move a balance in either direction.
/// </remarks>
public static partial class ArchLucidInstrumentation
{
    // Instrument catalog

    
    /// <summary>LLM wallet auto-refill failures (label: <c>stripe_decline_code</c>).</summary>
    public static readonly Counter<long> LlmWalletRefillFailuresTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_llm_wallet_refill_failures_total",
            description: "LLM wallet auto-refill Stripe failures (label stripe_decline_code).");

    
    /// <summary>LLM wallet auto-refill USD credited (TB-014).</summary>
    public static readonly Counter<double> LlmWalletRefillUsdTotal =
        AppMeter.CreateCounter<double>(
            "archlucid_llm_wallet_refill_usd_total",
            "USD",
            "LLM prepaid wallet refill USD credited after successful Stripe charge.");

    private static int _llmWalletBalanceObservableGaugeRegistered;

    private static readonly ConcurrentDictionary<string, double> LlmWalletBalanceUsdByTenant = new(StringComparer.Ordinal);

    /// <summary>Increments <see cref="LlmWalletRefillUsdTotal" /> after a successful wallet credit.</summary>
    public static void RecordLlmWalletRefillUsd(decimal amountUsd)
    {
        if (amountUsd <= 0m)
            return;

        LlmWalletRefillUsdTotal.Add((double)amountUsd);
    }

    /// <summary>Increments <see cref="LlmWalletRefillFailuresTotal" /> (label: stripe_decline_code).</summary>
    public static void RecordLlmWalletRefillFailure(string? declineCode)
    {
        TagList tags = new()
        {
            { "stripe_decline_code", string.IsNullOrWhiteSpace(declineCode) ? "unknown" : declineCode.Trim() },
        };

        LlmWalletRefillFailuresTotal.Add(1, tags);
    }

    /// <summary>Updates per-tenant wallet balance snapshot for <c>archlucid_llm_wallet_balance_usd</c>.</summary>
    public static void RecordLlmWalletBalanceUsd(Guid tenantId, decimal balanceUsd)
    {
        if (tenantId == Guid.Empty)
            return;

        EnsureLlmWalletBalanceObservableGaugeRegistered();
        LlmWalletBalanceUsdByTenant[tenantId.ToString("D", CultureInfo.InvariantCulture)] = (double)balanceUsd;
    }

    /// <summary>Registers observable per-tenant LLM wallet balance gauge (TB-014).</summary>
    public static void EnsureLlmWalletBalanceObservableGaugeRegistered()
    {
        if (Interlocked.Exchange(ref _llmWalletBalanceObservableGaugeRegistered, 1) != 0)
            return;

        AppMeter.CreateObservableGauge(
            "archlucid_llm_wallet_balance_usd",
            () =>
            {
                List<Measurement<double>> measurements = new(LlmWalletBalanceUsdByTenant.Count);

                foreach (KeyValuePair<string, double> kv in LlmWalletBalanceUsdByTenant)
                {
                    measurements.Add(
                        new Measurement<double>(
                            kv.Value,
                            new KeyValuePair<string, object?>("tenant_id", kv.Key)));
                }

                return measurements;
            },
            "USD",
            "Non-expiring LLM prepaid wallet balance (label tenant_id).");
    }
}
