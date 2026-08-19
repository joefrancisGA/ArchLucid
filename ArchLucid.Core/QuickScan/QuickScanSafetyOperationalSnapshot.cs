using ArchLucid.Core.Configuration;

namespace ArchLucid.Core.QuickScan;

/// <summary>Resolved Quick Scan operational posture for enforcement and public status (TB-898).</summary>
public sealed class QuickScanSafetyOperationalSnapshot
{
    public required QuickScanSafetyOperationalMode Mode { get; init; }

    public required bool AnonymousExecutionAllowed { get; init; }

    public required bool SampleResultAvailable { get; init; }

    public required string PublicMessage { get; init; }

    public required bool StoreHealthy { get; init; }

    public static QuickScanSafetyOperationalSnapshot FailClosed(string message) =>
        new()
        {
            Mode = QuickScanSafetyOperationalMode.EmergencyDisabled,
            AnonymousExecutionAllowed = false,
            SampleResultAvailable = true,
            PublicMessage = message,
            StoreHealthy = false,
        };

    public static QuickScanSafetyOperationalSnapshot NormalExecution(QuickScanSafetyOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        QuickScanSafetyEffectiveFeatureState effective = options.ResolveEffectiveFeatureState();

        return new QuickScanSafetyOperationalSnapshot
        {
            Mode = QuickScanSafetyOperationalMode.Normal,
            AnonymousExecutionAllowed = effective.Enabled && effective.AnonymousExecutionEnabled,
            SampleResultAvailable = effective.SampleFallbackEnabled,
            PublicMessage = string.Empty,
            StoreHealthy = true,
        };
    }
}
