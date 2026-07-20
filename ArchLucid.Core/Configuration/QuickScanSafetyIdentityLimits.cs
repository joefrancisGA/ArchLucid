namespace ArchLucid.Core.Configuration;

/// <summary>Per-identity anonymous Quick Scan rate limits (session, browser, IP).</summary>
public sealed class QuickScanSafetyIdentityLimits
{
    public int MaxScansPerSessionPerHour { get; set; } = 2;

    public int MaxScansPerSessionPerDay { get; set; } = 3;

    public int MaxScansPerBrowserPerHour { get; set; } = 3;

    public int MaxScansPerBrowserPerDay { get; set; } = 6;

    public int MaxScansPerIpPerHour { get; set; } = 6;

    public int MaxScansPerIpPerDay { get; set; } = 12;

    public int MaxScansPerIpRangePerHour { get; set; } = 24;

    public int MaxScansPerIpRangePerDay { get; set; } = 48;
}
