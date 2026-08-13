namespace ArchLucid.Core.Diagnostics;

/// <summary>Telemetry for fail-closed Sponsor ROI background tenant scope validation.</summary>
public static class SponsorRoiBackgroundScopeTelemetry
{
    public static void RecordViolation(string reason)
    {
        if (string.IsNullOrWhiteSpace(reason))
            reason = "unknown";

        ArchLucidInstrumentation.SponsorRoiBackgroundScopeViolationsTotal.Add(
            1,
            new KeyValuePair<string, object?>("reason", reason.Trim()));
    }
}
