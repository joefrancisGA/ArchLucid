using System.Text.Json;

using ArchLucid.Application.Governance.DefaultPolicyPacks;
using ArchLucid.Contracts.Compliance;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Decisioning.Compliance.Evaluators;
using ArchLucid.Decisioning.Compliance.Loaders;
using ArchLucid.Decisioning.Compliance.Models;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ContractsComplianceRule = ArchLucid.Contracts.Compliance.ComplianceRule;
using ContractsComplianceRulePack = ArchLucid.Contracts.Compliance.ComplianceRulePack;
using DecisioningComplianceRulePack = ArchLucid.Decisioning.Compliance.Models.ComplianceRulePack;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Application.Tests.Governance;

/// <summary>
///     Shared fixtures for bundled default policy pack coverage tests (manifest load, curated artifacts, graph simulator).
/// </summary>
internal static class DefaultPolicyPackCoverageTestSupport
{
    internal static string? TryFindRepoRoot()
    {
        DirectoryInfo? directory = new(AppContext.BaseDirectory);

        while (directory != null)
        {
            string samples = Path.Combine(directory.FullName, "docs", "samples", "policy-packs");

            if (Directory.Exists(samples))
                return directory.FullName;

            directory = directory.Parent;
        }

        return null;
    }

    internal static async Task<ContractsComplianceRulePack> LoadMergedGaStarterPackAsync()
    {
        string dir = Path.Combine(AppContext.BaseDirectory, "Compliance", "RulePacks");
        string defaultFile = Path.Combine(dir, "default-compliance.rules.json");
        string gaFile = Path.Combine(dir, "ga-starter-compliance.rules.json");

        if (!File.Exists(defaultFile) || !File.Exists(gaFile))
            throw new FileNotFoundException(
                $"Expected compliance rule packs at '{defaultFile}' and '{gaFile}'. "
                + "Ensure ArchLucid.Application.Tests copies Decisioning RulePacks to output.");

        MergedComplianceRulePackLoader loader = new([
            new FileComplianceRulePackLoader(defaultFile),
            new FileComplianceRulePackLoader(gaFile),
        ]);

        DecisioningComplianceRulePack pack = await loader.LoadAsync(CancellationToken.None);

        return (ContractsComplianceRulePack)pack;
    }

    internal static PolicyPackContentDocument DeserializeBundledContent(DefaultPolicyPackBundleDefinition bundle)
    {
        PolicyPackContentDocument? document = JsonSerializer.Deserialize<PolicyPackContentDocument>(
            bundle.ContentJson,
            PolicyPackJsonSerializerOptions.Default);

        if (document is null)
            throw new InvalidOperationException($"Bundled pack '{bundle.DisplayName}' did not deserialize.");

        return document;
    }

    internal static ContractsComplianceRulePack FilterPackRules(
        ContractsComplianceRulePack source,
        PolicyPackContentDocument document)
    {
        ContractsComplianceRulePack filtered = ComplianceRulePackGovernanceFilter.Filter(source, document);

        if (filtered.Rules.Count == 0)
            throw new InvalidOperationException(
                $"Bundled pack '{document.Metadata.GetValueOrDefault("pack.displayName")}' produced zero rules after governance filter.");

        return filtered;
    }

    internal static GraphSnapshot BuildUnderprotectedTopologyGraph(ContractsComplianceRule rule)
    {
        string category = string.IsNullOrWhiteSpace(rule.AppliesToCategory)
            ? "architecture"
            : rule.AppliesToCategory;

        return new GraphSnapshot
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "coverage-test-resource",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "coverage-test-resource",
                    Category = category,
                },
            ],
            Edges = [],
        };
    }

    internal static ComplianceViolation? EvaluateFirstViolation(
        ContractsComplianceRulePack filteredPack,
        GraphSnapshot graph)
    {
        GraphComplianceEvaluator evaluator = new();
        DecisioningComplianceRulePack decisioningPack = (DecisioningComplianceRulePack)filteredPack;
        ComplianceEvaluationResult evaluation = evaluator.Evaluate(graph, decisioningPack);

        if (evaluation.Violations.Count == 0)
            return null;

        return evaluation.Violations[0];
    }

    internal static void AssertCuratedArtifactAligns(
        string repoRoot,
        PolicyPackContentDocument document,
        string displayName)
    {
        if (!document.Metadata.TryGetValue("curatedRulesArtifact", out string? rel) ||
            string.IsNullOrWhiteSpace(rel))
            throw new InvalidOperationException($"Bundled pack '{displayName}' is missing curatedRulesArtifact metadata.");

        string curatedPath = Path.Combine(repoRoot, rel.Trim().Replace('/', Path.DirectorySeparatorChar));

        if (!File.Exists(curatedPath))
            throw new FileNotFoundException($"Curated rules artifact not found for '{displayName}' at '{curatedPath}'.");

        using FileStream stream = File.OpenRead(curatedPath);
        using JsonDocument curated = JsonDocument.Parse(stream);
        JsonElement rules = curated.RootElement.GetProperty("rules");
        HashSet<string> curatedIds = new(StringComparer.OrdinalIgnoreCase);

        foreach (JsonElement rule in rules.EnumerateArray())
        {
            string? id = rule.GetProperty("id").GetString();

            if (!string.IsNullOrWhiteSpace(id))
                curatedIds.Add(id.Trim());
        }

        HashSet<string> expectedIds = document.ComplianceRuleKeys
            .Where(static key => !string.IsNullOrWhiteSpace(key))
            .Select(static key => key.Trim())
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        if (!expectedIds.SetEquals(curatedIds))
            throw new InvalidOperationException(
                $"Bundled pack '{displayName}' complianceRuleKeys do not match curated artifact rule ids.");
    }
}
