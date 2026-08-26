using ArchLucid.Decisioning.Compliance.Models;

namespace ArchLucid.Decisioning.Governance.PolicyPacks;

/// <summary>
///     Maps declaration classifier themes to bundled curated-rule ids across CIS Azure/AWS/GCP,
///     SOC 2, GDPR, HIPAA, ISO 27001, PCI-DSS, Zero Trust, security baseline, and AKS/EKS/GKE packs.
///     Used when the tenant's filtered compliance pack opts into this vocabulary.
/// </summary>
public static class DeclarationSignalPolicyKeyMap
{
    private static readonly IReadOnlyDictionary<string, HashSet<string>> ThemeToRuleIds =
        new Dictionary<string, HashSet<string>>(StringComparer.OrdinalIgnoreCase)
        {
            ["data-protection"] = CreateThemeSet(
                // CIS Azure — storage public access / network / SQL public
                "cis-az-006", // Storage account public access disabled
                "cis-az-009", // Storage network rules restrict public endpoints
                "cis-az-012", // SQL public network access restricted
                "sec-base-028", // Private endpoints mandatory for regulated-class datastores
                // CIS AWS peers
                "cis-aws-006", // Storage account public access disabled
                "cis-aws-009", // Storage network rules restrict public endpoints
                "cis-aws-012", // SQL public network access restricted
                // CIS GCP peers
                "cis-gcp-006",
                "cis-gcp-009",
                "cis-gcp-012",
                // SOC 2 / PCI / ISO network segmentation
                "soc2-018", // Network segmentation for sensitive workloads
                "pci-002", // Network segmentation between CDE and out-of-scope
                "pci-003", // Inbound and outbound CDE traffic restricted
                "iso27001-025", // Network security perimeter documented
                // Kubernetes internal LB (public LB default)
                "aks-015", // Internal load balancers for east-west only
                "eks-015",
                "gke-015"),
            ["encryption"] = CreateThemeSet(
                "cis-az-012",
                "cis-az-025", // overlaps transport-security (App Service HTTPS/TLS)
                "cis-aws-007", // Storage encryption at rest enabled
                "cis-aws-011", // SQL TDE enabled for databases
                "cis-aws-020", // Managed disks encrypted
                "cis-gcp-007",
                "cis-gcp-011",
                "cis-gcp-020",
                "soc2-003", // Encryption protects data at rest
                "gdpr-001", // Personal data encrypted at rest
                "hipaa-017", // Encryption and decryption of ePHI
                "iso27001-010", // Cryptographic controls for data protection
                "pci-007", // PAN encryption at rest in CDE
                "zta-008"), // Encrypted communications everywhere
            ["transport-security"] = CreateThemeSet(
                "cis-az-025", // App Service HTTPS only and TLS minimum
                "cis-aws-025", // Elastic Beanstalk or Lambda HTTPS only and TLS minimum
                "cis-gcp-025", // Cloud Run HTTPS only and TLS minimum
                "soc2-004", // Encryption protects data in transit
                "gdpr-002", // Personal data encrypted in transit
                "hipaa-022", // Transmission security for ePHI
                "hipaa-024", // Encryption in transit for ePHI
                "pci-009", // TLS for PAN transmission over open networks
                "zta-008"),
            ["network-isolation"] = CreateThemeSet(
                "cis-az-018", // NSG rules follow least privilege
                "cis-az-019", // Just-in-time VM access for management ports
                "cis-aws-018",
                "cis-aws-019",
                "cis-gcp-018",
                "cis-gcp-019",
                "soc2-018",
                "zta-007", // Micro-segmentation for workloads
                "pci-002",
                "pci-003",
                "iso27001-025"),
            ["workload-isolation"] = CreateThemeSet(
                "cis-az-027", // Kubernetes API server access restricted
                "sec-base-028",
                "cis-aws-027", // Kubernetes API server access restricted (EKS)
                "cis-gcp-027", // Kubernetes API server access restricted (GKE)
                "aks-001", // Private AKS API server endpoint
                "aks-009", // Pod security standards enforced
                "aks-021", // Disallow hostPath and privileged mounts
                "eks-001",
                "eks-009",
                "eks-021",
                "gke-001",
                "gke-009",
                "gke-021"),
        };

    private static readonly HashSet<string> AllMappedRuleIds = ThemeToRuleIds.Values
        .SelectMany(static set => set)
        .ToHashSet(StringComparer.OrdinalIgnoreCase);

    /// <summary>All rule ids referenced by any theme map entry.</summary>
    public static IReadOnlySet<string> MappedRuleIds => AllMappedRuleIds;

    /// <summary>
    ///     Returns true when the tenant's filtered pack contains a mapped rule id or a
    ///     <see cref="DeclarationSignalPolicyPrefixFamily" /> prefix (e.g. <c>soc2-001</c> only).
    ///     Prefixes outside that family (cost-opt, ai-gov, dora, otel, sust-base, …) keep fail-open.
    /// </summary>
    public static bool TenantUsesDeclarationVocabulary(IReadOnlySet<string> activeRuleIds)
    {
        ArgumentNullException.ThrowIfNull(activeRuleIds);

        foreach (string ruleId in activeRuleIds)
        {
            if (AllMappedRuleIds.Contains(ruleId))
                return true;
        }

        return DeclarationSignalPolicyPrefixFamily.ActiveSetUsesDeclarationPrefixFamily(activeRuleIds);
    }

    public static bool IsThemeEnabled(string theme, IReadOnlySet<string> activeRuleIds)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(theme);
        ArgumentNullException.ThrowIfNull(activeRuleIds);

        if (!ThemeToRuleIds.TryGetValue(theme, out HashSet<string>? mappedKeys))
            return false;

        foreach (string ruleId in activeRuleIds)
        {
            if (mappedKeys.Contains(ruleId))
                return true;
        }

        return false;
    }

    public static string? TryGetFirstMappedRuleId(string theme, IReadOnlySet<string> activeRuleIds)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(theme);
        ArgumentNullException.ThrowIfNull(activeRuleIds);

        if (!ThemeToRuleIds.TryGetValue(theme, out HashSet<string>? mappedKeys))
            return null;

        foreach (string ruleId in activeRuleIds)
        {
            if (mappedKeys.Contains(ruleId))
                return ruleId;
        }

        return null;
    }

    public static HashSet<string> CollectActiveRuleIds(ComplianceRulePack rulePack)
    {
        ArgumentNullException.ThrowIfNull(rulePack);

        return rulePack.Rules
            .Where(static rule => !string.IsNullOrWhiteSpace(rule.RuleId))
            .Select(static rule => rule.RuleId)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
    }

    private static HashSet<string> CreateThemeSet(params string[] ruleIds) =>
        ruleIds.ToHashSet(StringComparer.OrdinalIgnoreCase);
}
