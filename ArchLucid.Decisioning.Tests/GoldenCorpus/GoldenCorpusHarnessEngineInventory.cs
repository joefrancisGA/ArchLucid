using ArchLucid.Decisioning.Plugins;

namespace ArchLucid.Decisioning.Tests.GoldenCorpus;

/// <summary>
/// CI-visible inventory: every product <c>EngineType</c> is registered in
/// <see cref="GoldenCorpusHarness"/> or listed absent with a one-line reason (SD-03).
/// </summary>
public static class GoldenCorpusHarnessEngineInventory
{
    public const int RegisteredEngineCount = 16;

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
        "compliance",
        "cost-constraint",
        "declaration-security-baseline",
        "declaration-premise-conflict",
    ];

    private static readonly IReadOnlyDictionary<string, string> AbsentReasons =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["requirement-gap"] = "Needs cross-run requirement diff graph — not present on golden corpus graphs.",
            ["requirement-cross-run-diff"] = "Cross-run diff engine — golden corpus is single-snapshot per case.",
            ["topology-cross-run-diff"] = "Cross-run topology diff — golden corpus is single-snapshot per case.",
            ["topology-anti-pattern"] = "Anti-pattern engine needs richer topology fixtures than case-01..case-36.",
            ["security-baseline-expectation"] = "Expectation engine needs declaration fixtures beyond default graphs.",
            ["policy-applicability"] = "Policy-filtered packs exercised in WK-22 sibling tests, not merge harness.",
            ["policy-coverage"] = "Policy-filtered packs exercised in WK-22 sibling tests, not merge harness.",
            ["required-capability-coverage"] = "Capability coverage needs inventory-shaped graph not in corpus.",
            ["cost-breach"] = "Cost breach needs live cost telemetry — not on static golden graphs.",
            ["orphaned-azure-resource"] = "Azure inventory reconciliation — needs cloud inventory snapshot.",
            ["advisor-cost-recommendation"] = "Advisor recommendations — needs Azure Advisor payload.",
            ["azure-inventory-reconciliation"] = "Azure inventory reconciliation — needs cloud inventory snapshot.",
            ["aws-inventory-reconciliation"] = "AWS inventory reconciliation — needs cloud inventory snapshot.",
            ["gcp-inventory-reconciliation"] = "GCP inventory reconciliation — needs cloud inventory snapshot.",
            ["orphaned-aws-resource"] = "AWS orphan scan — needs cloud inventory snapshot.",
            ["orphaned-gcp-resource"] = "GCP orphan scan — needs cloud inventory snapshot.",
            ["aws-cost-recommendation"] = "AWS cost recommendations — needs cloud cost payload.",
            ["gcp-cost-recommendation"] = "GCP cost recommendations — needs cloud cost payload.",
            ["azure-inventory-security-baseline"] = "Azure inventory security baseline — needs inventory snapshot.",
            ["aws-inventory-security-baseline"] = "AWS inventory security baseline — needs inventory snapshot.",
            ["gcp-inventory-security-baseline"] = "GCP inventory security baseline — needs inventory snapshot.",
            ["open-commitment"] = "Open-commitment engine reads disposition trail — not wired on golden corpus runs.",
            ["portfolio-recurrence"] = "Portfolio recurrence needs multi-run tenant history — not on golden corpus.",
            ["segmentation-semantics"] = "Segmentation semantics needs NSG/NetworkPolicy rule blobs with sensitive target paths — not on default golden graphs.",
            ["dr-rpo-topology"] = "DR/RPO topology checks need requirement text plus linked SQL/storage nodes — not on default golden graphs.",
        };

    public static IReadOnlyDictionary<string, string> AbsentEngineReasons => AbsentReasons;

    public static bool TryGetAbsentReason(string engineTypeId, out string reason)
    {
        return AbsentReasons.TryGetValue(engineTypeId, out reason!);
    }

    public static void ValidateCatalogCoverage()
    {
        HashSet<string> registered = RegisteredEngineTypeIds.ToHashSet(StringComparer.OrdinalIgnoreCase);
        HashSet<string> catalog = BuiltInFindingEngineTypeCatalog.EngineTypeIds.ToHashSet(StringComparer.OrdinalIgnoreCase);

        foreach (string engineTypeId in catalog)
        {
            if (registered.Contains(engineTypeId))
            {
                continue;
            }

            if (!AbsentReasons.ContainsKey(engineTypeId))
            {
                throw new InvalidOperationException(
                    $"EngineType '{engineTypeId}' is neither registered in the harness nor listed absent-with-reason.");
            }
        }

        foreach (string registeredId in registered)
        {
            if (!catalog.Contains(registeredId))
            {
                throw new InvalidOperationException(
                    $"Harness registers unknown EngineType '{registeredId}' — update BuiltInFindingEngineTypeCatalog.");
            }
        }
    }
}
