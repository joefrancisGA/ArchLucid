namespace ArchLucid.Core.Configuration;

/// <summary>Feature flags after emergency override is applied.</summary>
public readonly record struct QuickScanSafetyEffectiveFeatureState(
    bool Enabled,
    bool AnonymousExecutionEnabled,
    bool SampleFallbackEnabled);
