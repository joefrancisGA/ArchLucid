namespace ArchLucid.Application.Findings;

/// <summary>Rotation and expiry thresholds for the secrets-lifecycle engine (DX-09).</summary>
public static class SecretsLifecycleThresholds
{
    /// <summary>Emit when last rotation/update is older than this many days.</summary>
    public const int StaleRotationDays = 90;

    /// <summary>Emit when expiry is within this many days (inclusive).</summary>
    public const int ExpiryWarningDays = 14;

    public const int MaxFindings = 15;
}
