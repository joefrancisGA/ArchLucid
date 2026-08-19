namespace ArchLucid.Core.Configuration;

/// <summary>
///     Marks catalog keys that participate in production-profile fail-fast / advisory validation (see
///     <see cref="ArchLucid.Core.Hosting.ProductionDangerousMisconfigurationLint" />). Used by architecture tests for INV-005 catalog parity.
/// </summary>
public enum ConfigurationKeyProductionProfileGuardKind
{
    None,

    /// <summary>Developer-only auth or open-access style toggles (must not survive into production-profile hosts).</summary>
    DeveloperBypass,

    /// <summary>Policy / safety keys evaluated when production-profile validation is active.</summary>
    SoftGuard,
}
