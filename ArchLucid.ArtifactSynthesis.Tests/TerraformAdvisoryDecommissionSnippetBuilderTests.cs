using ArchLucid.ArtifactSynthesis.Services;
using ArchLucid.Core.Manifest;

using FluentAssertions;

using Xunit;

namespace ArchLucid.ArtifactSynthesis.Tests;

/// <summary>Golden-output guards for advisory Terraform comment emit (<see cref="TerraformAdvisoryDecommissionSnippetBuilder" />).</summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TerraformAdvisoryDecommissionSnippetBuilderTests
{
    [Fact]
    public void BuildDecisionSection_includes_arch_lucid_advisory_header_and_hints()
    {
        ResolvedArchitectureDecision decision = new()
        {
            DecisionId = "dec-42",
            Category = "Cost",
            Title = "Retire idle resource group wiring",
            SelectedOption = "azurerm_resource_group.demo_rg",
            Rationale = "Avoid orphaned RG billing.",
            RelatedNodeIds = ["azurerm_resource_group.demo_rg"]
        };

        string snippet = TerraformAdvisoryDecommissionSnippetBuilder.BuildDecisionSection(decision);

        snippet.Should().StartWith(TerraformAdvisoryDecommissionSnippetBuilder.AdvisoryHeaderLine);
        snippet.Should().Contain(TerraformAdvisoryDecommissionSnippetBuilder.AdvisoryMdPointerLine);
        snippet.Should().Contain("Decision dec-42");
        snippet.Should().Contain("azurerm_resource_group.demo_rg");

        Assert.DoesNotContain("destroy", snippet, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void BuildNoDecommissionManifestStub_matches_stable_intro_lines()
    {
        string stub = TerraformAdvisoryDecommissionSnippetBuilder.BuildNoDecommissionManifestStub();

        stub.Should().Be(
            string.Join(
                Environment.NewLine,
                TerraformAdvisoryDecommissionSnippetBuilder.AdvisoryHeaderLine,
                "# No decommission-style decisions in this manifest — no removal blocks emitted."));
    }
}
