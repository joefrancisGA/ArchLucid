using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Plugins;

namespace ArchLucid.Decisioning.Tests.GoldenCorpus;

/// <summary>
/// CI-visible inventory: every product <c>EngineType</c> is registered in
/// <see cref="GoldenCorpusHarness"/> or listed absent with a one-line reason (SD-03).
/// </summary>
public static class GoldenCorpusHarnessEngineInventory
{
    public static int RegisteredEngineCount => GoldenCorpusHarnessEngineRegistration.RegisteredEngineCount;

    public static IReadOnlyList<string> RegisteredEngineTypeIds =>
        GoldenCorpusHarnessEngineRegistration.RegisteredEngineTypeIds;

    private static readonly IReadOnlyDictionary<string, string> AbsentReasons =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["requirement-gap"] = "Needs cross-run requirement diff graph — not present on golden corpus graphs.",
            ["requirement-cross-run-diff"] = "Cross-run diff engine — golden corpus is single-snapshot per case.",
            ["topology-cross-run-diff"] = "Cross-run topology diff — golden corpus is single-snapshot per case.",
            ["topology-anti-pattern"] = "Anti-pattern engine needs richer topology fixtures than case-01..case-40.",
            ["security-baseline-expectation"] = "Expectation engine needs declaration fixtures beyond default graphs.",
            ["policy-applicability"] = "Policy-filtered packs exercised in WK-22 sibling tests, not merge harness.",
            ["policy-coverage"] = "Policy-filtered packs exercised in WK-22 sibling tests, not merge harness.",
            ["required-capability-coverage"] = "Capability coverage needs inventory-shaped graph not in corpus.",
            ["cost-breach"] = "Cost breach needs live cost telemetry — not on static golden graphs.",
            ["requirement-sku-tier"] = "SKU/replication tier checks need requirement redundancy text plus linked datastore SKU properties — not on default golden graphs.",
            ["dangling-declaration-reference"] = "Cross-file dangling refs need paired source/target fixtures — not on default golden graphs.",
            ["checklist-cluster-synthesis"] = "Post-gate synthesis stage — needs clustered ChecklistCoverage fixtures, not graph-only golden cases.",
            ["insight-generator"] = "Insight generator is a real-mode Premium LLM pass — harness uses NoOpInsightFindingGenerator.",
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
