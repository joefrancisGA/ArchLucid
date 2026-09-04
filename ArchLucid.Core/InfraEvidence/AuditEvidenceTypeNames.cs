namespace ArchLucid.Core.InfraEvidence;

/// <summary>Well-known evidence type tokens referenced by imported catalogs and selectors.</summary>
public static class AuditEvidenceTypeNames
{
    public const string Identity = "identity";
    public const string Rbac = "rbac";
    public const string Network = "network";
    public const string Data = "data";
    public const string Logging = "logging";
    public const string Governance = "governance";
    public const string Posture = "posture";
    public const string Resilience = "resilience";
    public const string Inventory = "inventory";

    public static readonly IReadOnlySet<string> EntraSpecificTypes = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        "entra",
        "entra-conditional-access",
        "entra-pim",
        "defender",
    };
}
