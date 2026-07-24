namespace ArchLucid.Core.Configuration;

/// <summary>Operator-facing Quick Scan safety modes (TB-898).</summary>
public enum QuickScanSafetyOperationalMode
{
    Normal = 0,
    Disabled = 1,
    EmergencyDisabled = 2,
    SampleOnly = 3,
}
