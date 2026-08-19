namespace ArchLucid.Core.Configuration;

/// <summary>
///     Authoritative server-side safety configuration for anonymous Quick Scan (TB-892).
///     Runtime enforcement wires in TB-893–TB-898; client limits are never trusted.
/// </summary>
public sealed class QuickScanSafetyOptions
{
    public const string SectionPath = "ArchLucid:QuickScan:Safety";

    public bool Enabled { get; set; }

    public bool AnonymousExecutionEnabled { get; set; }

    public bool SampleFallbackEnabled { get; set; } = true;

    public bool EmergencyDisabled { get; set; }

    public string EmergencyDisabledMessage { get; set; } =
        "Quick Scan is temporarily unavailable. Try the illustrative sample or sign in for a full review.";

    public QuickScanSafetyPerRequestLimits PerRequest { get; set; } = new();

    public QuickScanSafetyConcurrencyLimits Concurrency { get; set; } = new();

    public QuickScanSafetyIdentityLimits Identity { get; set; } = new();

    public QuickScanSafetyGlobalRequestLimits GlobalRequests { get; set; } = new();

    public QuickScanSafetyGlobalBudgetLimits GlobalBudget { get; set; } = new();

    public QuickScanSafetyProgressiveFrictionLimits ProgressiveFriction { get; set; } = new();

    public QuickScanSafetyModelLimits Models { get; set; } = new();

    public QuickScanSafetyAbuseLimits Abuse { get; set; } = new();

    public QuickScanSafetyTelemetryLimits Telemetry { get; set; } = new();

    public QuickScanSafetyBudgetMonitoringOptions BudgetMonitoring { get; set; } = new();

    /// <summary>
    ///     Resolves effective feature flags after <see cref="EmergencyDisabled" /> precedence.
    /// </summary>
    public QuickScanSafetyEffectiveFeatureState ResolveEffectiveFeatureState()
    {
        if (EmergencyDisabled)
        {
            return new QuickScanSafetyEffectiveFeatureState(
                Enabled: false,
                AnonymousExecutionEnabled: false,
                SampleFallbackEnabled: SampleFallbackEnabled);
        }

        return new QuickScanSafetyEffectiveFeatureState(
            Enabled: Enabled,
            AnonymousExecutionEnabled: AnonymousExecutionEnabled,
            SampleFallbackEnabled: SampleFallbackEnabled);
    }
}
