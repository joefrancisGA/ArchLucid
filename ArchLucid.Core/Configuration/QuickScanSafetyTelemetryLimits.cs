namespace ArchLucid.Core.Configuration;

/// <summary>Telemetry and retention policy for anonymous Quick Scan prompts and responses.</summary>
public sealed class QuickScanSafetyTelemetryLimits
{
    public bool RetainFullPrompts { get; set; }

    public bool RetainFullResponses { get; set; }

    public int RetentionDays { get; set; } = 30;
}
