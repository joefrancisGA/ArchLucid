using ArchLucid.ArtifactSynthesis.Docx;
using ArchLucid.ArtifactSynthesis.Docx.Models;
using ArchLucid.ArtifactSynthesis.Models;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

/// <summary>RC29c package-coverage batch: inventory/issue models, DOCX export DTOs, and style ids.</summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArtifactSynthesisPackageCoverageBatchRc29cTests
{
    [Fact]
    public void Inventory_and_unresolved_issue_models_accept_item_collections()
    {
        InventoryArtifactModel inventory = new()
        {
            Items =
            [
                new InventoryItem
                {
                    Category = "Compute",
                    Name = "Orders API",
                    Status = "Active",
                    Notes = "AKS workload",
                },
            ],
        };

        UnresolvedIssuesArtifactModel issues = new()
        {
            Items =
            [
                new UnresolvedIssueArtifactItem
                {
                    IssueType = "ArchitectureGap",
                    Title = "Missing DR region",
                    Description = "No secondary region declared.",
                    Severity = "High",
                },
            ],
        };

        inventory.Items.Should().ContainSingle();
        inventory.Items[0].Category.Should().Be("Compute");
        issues.Items[0].Title.Should().Be("Missing DR region");
    }

    [Fact]
    public void DocxExportRequest_ForArchitecturePackage_maps_metadata_fields()
    {
        Guid runId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid manifestId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

        DocxExportRequest request = DocxExportRequest.ForArchitecturePackage(
            runId,
            manifestId,
            "Architecture Package",
            "Generated for review",
            manifestComparison: null,
            comparisonExplanation: null,
            runExplanation: null,
            findingsSnapshot: null);

        request.RunId.Should().Be(runId);
        request.ManifestId.Should().Be(manifestId);
        request.DocumentTitle.Should().Be("Architecture Package");
        request.Subtitle.Should().Be("Generated for review");
        request.IncludeArtifactsAppendix.Should().BeTrue();
        request.IncludeArchitectureDiagram.Should().BeTrue();
    }

    [Fact]
    public void DocxExportResult_and_style_ids_expose_word_defaults()
    {
        DocxExportResult result = new()
        {
            FileName = "architecture-package.docx",
            Content = [0x50, 0x4b, 0x03, 0x04],
        };

        result.FileName.Should().EndWith(".docx");
        result.ContentType.Should().Contain("wordprocessingml");

        DocxStyleIds.Title.Should().Be("Title");
        DocxStyleIds.Heading1.Should().Be("Heading1");
        DocxStyleIds.BodyText.Should().Be("BodyText");
        DocxStyleIds.TableHeader.Should().Be("TableHeader");
    }
}
