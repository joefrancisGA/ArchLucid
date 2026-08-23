using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DeploymentEvidenceTerraformReferenceTests
{
    [Fact]
    public void DefaultApplyOrderRoots_lists_composition_waves_then_hosted_leaves()
    {
        IReadOnlyList<string> roots = DeploymentEvidenceTerraformReference.DefaultApplyOrderRoots();

        roots.Should().Contain(r => r.Contains("infra/terraform-foundation", StringComparison.Ordinal));
        roots.Should().Contain(r => r.Contains("infra/terraform-pilot", StringComparison.Ordinal));

        int foundationIndex = IndexOfPath(roots, "infra/terraform-foundation");
        int privateIndex = IndexOfPath(roots, "infra/terraform-private");
        int monitoringIndex = IndexOfPath(roots, "infra/terraform-monitoring");
        int orchestratorIndex = IndexOfPath(roots, "infra/terraform-orchestrator");
        int pilotIndex = IndexOfPath(roots, "infra/terraform-pilot");

        foundationIndex.Should().BeGreaterThanOrEqualTo(0);
        privateIndex.Should().BeGreaterThan(foundationIndex);
        monitoringIndex.Should().BeGreaterThan(privateIndex);
        orchestratorIndex.Should().BeGreaterThan(monitoringIndex);
        pilotIndex.Should().BeGreaterThan(orchestratorIndex);

        roots.Should().Contain(r => r.Contains("infra/terraform-redis", StringComparison.Ordinal));
        roots.Should().Contain(r => r.Contains("infra/terraform-cosmos", StringComparison.Ordinal));
        roots.Should().Contain(r => r.Contains("infra/terraform-acr", StringComparison.Ordinal));

        int acrIndex = IndexOfPath(roots, "infra/terraform-acr");
        int entraIndex = IndexOfPath(roots, "infra/terraform-entra");

        acrIndex.Should().BeGreaterThanOrEqualTo(0);
        entraIndex.Should().BeGreaterThan(acrIndex);
    }

    [Fact]
    public void DefaultApplyOrderRoots_leaf_sequence_matches_apply_saas_multi_root_order()
    {
        string[] expectedLeafPaths =
        [
            "infra/terraform-private",
            "infra/terraform-keyvault",
            "infra/terraform-sql-failover",
            "infra/terraform-storage",
            "infra/terraform-redis",
            "infra/terraform-cosmos",
            "infra/terraform-servicebus",
            "infra/terraform-logicapps",
            "infra/terraform-openai",
            "infra/terraform-acr",
            "infra/terraform-entra",
            "infra/terraform-container-apps",
            "infra/terraform-edge",
            "infra/terraform",
            "infra/terraform-monitoring",
            "infra/terraform-orchestrator",
        ];

        IReadOnlyList<string> roots = DeploymentEvidenceTerraformReference.DefaultApplyOrderRoots();
        List<string> leafPaths = roots
            .Where(line => !line.Contains("metadata composition root", StringComparison.Ordinal)
                && !line.Contains("canonical default profile", StringComparison.Ordinal))
            .Select(line => line.Split(" —", 2, StringSplitOptions.None)[0].Trim())
            .ToList();

        leafPaths.Should().Equal(expectedLeafPaths);
    }

    private static int IndexOfPath(IReadOnlyList<string> roots, string path)
    {
        for (int i = 0; i < roots.Count; i++)
        {

            if (roots[i].Contains(path, StringComparison.Ordinal))
            {
                return i;
            }
        }

        return -1;
    }
}
