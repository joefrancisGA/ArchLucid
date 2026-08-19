namespace ArchLucid.Host.Core.Hosted;

/// <summary>Polling cadence clamps shared by <see cref="WeeklyArchitectureDigestHostedService"/> diagnostics.</summary>
internal static class WeeklyArchitectureDigestPollingDefaults
{
    public const int MinPollingIntervalHours = 1;

    public const int MaxPollingIntervalHours = 24 * 365;
}
