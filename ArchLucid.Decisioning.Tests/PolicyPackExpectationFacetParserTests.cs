using System.Text.Json;

using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Governance.PolicyPacks;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests;

[Trait("Category", "Unit")]
public sealed class PolicyPackExpectationFacetParserTests
{
    [Fact]
    public void Parse_null_effective_returns_empty_facet()
    {
        PolicyPackExpectationFacet facet = PolicyPackExpectationFacetParser.Parse(null);

        facet.IsEmpty.Should().BeTrue();
    }

    [Fact]
    public void Parse_splits_pipe_separated_topology_and_skips_unknown()
    {
        PolicyPackContentDocument effective = new()
        {
            AdvisoryDefaults =
            {
                [PolicyPackExpectationAdvisoryKeys.TopologyCategoriesAdd] = "identity|bogus|network",
            },
        };

        PolicyPackExpectationFacet facet = PolicyPackExpectationFacetParser.Parse(effective);

        facet.ExtraTopologyCategories.Should().Equal("identity", "network");
    }

    [Fact]
    public void Parse_require_budget_cap_true_false_and_invalid()
    {
        PolicyPackContentDocument trueDoc = new()
        {
            AdvisoryDefaults = { [PolicyPackExpectationAdvisoryKeys.CostRequireBudgetCap] = "yes" },
        };
        PolicyPackExpectationFacetParser.Parse(trueDoc).RequireBudgetCap.Should().BeTrue();

        PolicyPackContentDocument falseDoc = new()
        {
            AdvisoryDefaults = { [PolicyPackExpectationAdvisoryKeys.CostRequireBudgetCap] = "0" },
        };
        PolicyPackExpectationFacetParser.Parse(falseDoc).RequireBudgetCap.Should().BeFalse();

        PolicyPackContentDocument invalidDoc = new()
        {
            AdvisoryDefaults = { [PolicyPackExpectationAdvisoryKeys.CostRequireBudgetCap] = "maybe" },
        };
        PolicyPackExpectationFacetParser.Parse(invalidDoc).RequireBudgetCap.Should().BeNull();
    }

    [Fact]
    public void Parse_breach_severity_valid_and_invalid()
    {
        PolicyPackContentDocument valid = new()
        {
            AdvisoryDefaults = { [PolicyPackExpectationAdvisoryKeys.CostBreachSeverity] = "Critical" },
        };
        PolicyPackExpectationFacetParser.Parse(valid).BreachSeverity.Should().Be("Critical");

        PolicyPackContentDocument invalid = new()
        {
            AdvisoryDefaults = { [PolicyPackExpectationAdvisoryKeys.CostBreachSeverity] = "Urgent" },
        };
        PolicyPackExpectationFacetParser.Parse(invalid).BreachSeverity.Should().BeNull();
    }

    [Fact]
    public void Parse_bundled_finops_cost_optimization_requires_budget_cap()
    {
        string? repoRoot = TryFindRepoRoot();

        repoRoot.Should().NotBeNull();

        string path = Path.Combine(
            repoRoot!,
            "ArchLucid.Application",
            "Governance",
            "DefaultPolicyPacks",
            "Bundled",
            "cost-optimization.json");

        string json = File.ReadAllText(path);
        PolicyPackContentDocument? document = JsonSerializer.Deserialize<PolicyPackContentDocument>(
            json,
            ArchLucid.Decisioning.Governance.PolicyPacks.PolicyPackJsonSerializerOptions.Default);

        document.Should().NotBeNull();

        PolicyPackExpectationFacet facet = PolicyPackExpectationFacetParser.Parse(document);

        facet.RequireBudgetCap.Should().BeTrue();
    }

    [Fact]
    public void Parse_bundled_cis_azure_adds_identity_topology_extra()
    {
        string? repoRoot = TryFindRepoRoot();

        repoRoot.Should().NotBeNull();

        string path = Path.Combine(
            repoRoot!,
            "ArchLucid.Application",
            "Governance",
            "DefaultPolicyPacks",
            "Bundled",
            "cis-azure-foundations.json");

        string json = File.ReadAllText(path);
        PolicyPackContentDocument? document = JsonSerializer.Deserialize<PolicyPackContentDocument>(
            json,
            ArchLucid.Decisioning.Governance.PolicyPacks.PolicyPackJsonSerializerOptions.Default);

        document.Should().NotBeNull();

        PolicyPackExpectationFacet facet = PolicyPackExpectationFacetParser.Parse(document);

        facet.ExtraTopologyCategories.Should().Contain("identity");
    }

    private static string? TryFindRepoRoot()
    {
        DirectoryInfo? directory = new(AppContext.BaseDirectory);

        while (directory is not null)
        {
            string bundled = Path.Combine(
                directory.FullName,
                "ArchLucid.Application",
                "Governance",
                "DefaultPolicyPacks",
                "Bundled");

            if (Directory.Exists(bundled))
                return directory.FullName;

            directory = directory.Parent;
        }

        return null;
    }
}
