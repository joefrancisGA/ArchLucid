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
        roots.Should().Contain(r => r.Contains("infra/terraform-redis", StringComparison.Ordinal));
        roots.Should().Contain(r => r.Contains("infra/terraform-cosmos", StringComparison.Ordinal));
        roots.Should().Contain(r => r.Contains("infra/terraform-acr", StringComparison.Ordinal));

        int acrIndex = IndexOfPath(roots, "infra/terraform-acr");
        int entraIndex = IndexOfPath(roots, "infra/terraform-entra");

        acrIndex.Should().BeGreaterThanOrEqualTo(0);
        entraIndex.Should().BeGreaterThan(acrIndex);
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
