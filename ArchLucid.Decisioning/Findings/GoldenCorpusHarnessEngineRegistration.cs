namespace ArchLucid.Decisioning.Findings;

/// <summary>
///     Harness engine registration contract shared by insight-density measurement copy and golden corpus tests.
/// </summary>
public static class GoldenCorpusHarnessEngineRegistration
{
    public const int LatestGoldenCorpusCaseNumber = 40;

    public static IReadOnlyList<string> RegisteredEngineTypeIds { get; } =
    [
        "requirement",
        "requirement-expectation",
        "requirement-coverage",
        "topology-coverage",
        "topology-structure",
        "security-baseline",
        "security-baseline-completeness",
        "security-gap",
        "security-coverage",
        "external-exposure",
        "trust-boundary",
        "privileged-access",
        "identity-blast-radius",
        "segmentation-semantics",
        "dr-rpo-topology",
        "compliance",
        "cost-constraint",
        "declaration-security-baseline",
        "declaration-premise-conflict",
        "orphaned-azure-resource",
        "advisor-cost-recommendation",
        "azure-inventory-reconciliation",
        "aws-inventory-reconciliation",
        "gcp-inventory-reconciliation",
        "declaration-inventory-contradiction",
        "orphaned-aws-resource",
        "orphaned-gcp-resource",
        "aws-cost-recommendation",
        "gcp-cost-recommendation",
        "azure-inventory-security-baseline",
        "aws-inventory-security-baseline",
        "gcp-inventory-security-baseline",
        "open-commitment",
        "secrets-lifecycle",
        "portfolio-recurrence",
    ];

    public static int RegisteredEngineCount => RegisteredEngineTypeIds.Count;
}
