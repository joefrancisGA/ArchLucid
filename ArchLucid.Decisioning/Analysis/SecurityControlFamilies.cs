namespace ArchLucid.Decisioning.Analysis;

/// <summary>
///     Canonical security control-family labels used by the workload completeness matrix (TB-2209).
/// </summary>
public static class SecurityControlFamilies
{
    public const string IdentityAccess = "identity-access";

    public const string NetworkIsolation = "network-isolation";

    public const string DataProtection = "data-protection";

    public const string Encryption = "encryption";

    public const string LoggingMonitoring = "logging-monitoring";

    public const string VulnerabilityManagement = "vulnerability-management";
}
