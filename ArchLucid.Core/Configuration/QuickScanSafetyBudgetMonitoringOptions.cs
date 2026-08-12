namespace ArchLucid.Core.Configuration;

/// <summary>Operator monitoring and reconciliation tuning for Quick Scan global budget (TB-899).</summary>
public sealed class QuickScanSafetyBudgetMonitoringOptions
{
    public int ReconciliationIntervalMinutes { get; set; } = 15;
}
