namespace ArchLucid.Core.Diagnostics;

/// <summary>Telemetry for fail-closed Executive ROI background tenant scope validation.</summary>
public static class ExecutiveRoiBackgroundScopeTelemetry
{
    public static void RecordViolation(string reason)
    {
        if (string.IsNullOrWhiteSpace(reason))
            reason = "unknown";

        ArchLucidInstrumentation.ExecutiveRoiBackgroundScopeViolationsTotal.Add(
            1,
            new KeyValuePair<string, object?>("reason", reason.Trim()));
    }
}
