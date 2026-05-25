using System.Diagnostics.Metrics;

namespace ArchLucid.Core.Diagnostics;

/// <summary>Builds Prometheus measurements for <c>archlucid_tenant_estimated_savings_usd</c>.</summary>
public static class ExecutiveRoiSavingsGaugeTelemetry
{
    public const string PlatformScope = "platform";

    public const string TenantScope = "tenant";

    public static Measurement<double>[] BuildMeasurements(
        decimal platformTotalUsd,
        IReadOnlyList<(Guid TenantId, decimal SavingsUsd)> perTenantRows,
        bool recordPerTenant)
    {
        List<Measurement<double>> measurements = new(capacity: 1 + (recordPerTenant ? perTenantRows.Count : 0));

        measurements.Add(
            new Measurement<double>(
                ToPrometheusDouble(platformTotalUsd),
                new KeyValuePair<string, object?>("scope", PlatformScope)));

        if (!recordPerTenant)
            return measurements.ToArray();

        foreach ((Guid tenantId, decimal savingsUsd) in perTenantRows)
        {
            if (tenantId == Guid.Empty)
                continue;

            measurements.Add(
                new Measurement<double>(
                    ToPrometheusDouble(savingsUsd),
                    new KeyValuePair<string, object?>("scope", TenantScope),
                    new KeyValuePair<string, object?>("tenant_id", tenantId.ToString("D"))));
        }

        return measurements.ToArray();
    }

    internal static double ToPrometheusDouble(decimal usd)
    {
        if (usd < 0m)
            return 0d;

        return (double)usd;
    }
}
