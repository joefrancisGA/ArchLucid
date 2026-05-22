using ArchLucid.ArtifactSynthesis.Generators;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Services;
using ArchLucid.ArtifactSynthesis.Validation;
using ArchLucid.Core.Manifest;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

/// <summary>Regression guard: advisory Terraform must never emit destructive HCL when inputs ask for removal.</summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TerraformAdvisorySafetyTests
{
    [Fact]
    public async Task GenerateAsync_when_agent_recommends_delete_emits_comments_and_never_emits_destroy_token()
    {
        ManifestDocument manifest = new()
        {
            RunId = Guid.NewGuid(),
            ManifestId = Guid.NewGuid(),
            Decisions =
            [
                new ResolvedArchitectureDecision
                {
                    DecisionId = "dec-delete-vm",
                    Category = "Cost",
                    Title = "Delete idle Linux VM in production subscription",
                    SelectedOption = "Remove azurerm_virtual_machine.idle-app",
                    Rationale = "Terraform plan should drop the resource to save spend.",
                    RelatedNodeIds = ["azurerm_virtual_machine.idle-app"],
                },
            ],
        };

        TerraformAdvisoryArtifactGenerator sut = new(CompositeTerraformValidator.Instance);

        SynthesizedArtifact artifact = await sut.GenerateAsync(manifest, CancellationToken.None);

        artifact.ArtifactType.Should().Be(ArtifactType.TerraformAdvisory);
        artifact.Content.Should().Contain(TerraformAdvisoryDecommissionSnippetBuilder.AdvisoryHeaderLine);
        artifact.Content.Should().Contain("ADVISORY.md", "operators must be pointed at bundled non-apply notice");

        artifact.Content.Contains("destroy", StringComparison.OrdinalIgnoreCase).Should().BeFalse(
            "advisory HCL must not contain the destructive Terraform verb token");

        artifact.Content.Should().Contain("azurerm_virtual_machine.idle-app");
    }
}
