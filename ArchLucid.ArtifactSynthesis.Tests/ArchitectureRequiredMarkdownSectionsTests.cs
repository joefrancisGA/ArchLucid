using System.Text;

using ArchLucid.ArtifactSynthesis.Generators;
using ArchLucid.ArtifactSynthesis.Markdown;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Services;
using ArchLucid.ArtifactSynthesis.Validation;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

/// <summary>
///     Private-beta create-run 400s when generated architecture markdown omits the product
///     <c>##</c> headers that <see cref="ArtifactBundleValidator" /> requires.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArchitectureRequiredMarkdownSectionsTests
{
    [Fact]
    public async Task ArchitectureNarrative_output_includes_required_product_section_headers()
    {
        ArchitectureNarrativeArtifactGenerator generator = new();
        SynthesizedArtifact artifact = await generator.GenerateAsync(CreatePopulatedManifest(), CancellationToken.None);

        ArchitectureMarkdownSectionValidator.GetMissingSectionHeaders(artifact.Content).Should().BeEmpty();
        new ArtifactBundleValidator().Invoking(v => v.Validate(BundleOf(artifact))).Should().NotThrow();
    }

    [Fact]
    public async Task ReferenceArchitectureMarkdown_output_includes_required_product_section_headers()
    {
        ReferenceArchitectureMarkdownGenerator generator = new();
        SynthesizedArtifact artifact = await generator.GenerateAsync(CreatePopulatedManifest(), CancellationToken.None);

        ArchitectureMarkdownSectionValidator.GetMissingSectionHeaders(artifact.Content).Should().BeEmpty();
        new ArtifactBundleValidator().Invoking(v => v.Validate(BundleOf(artifact))).Should().NotThrow();
    }

    [Fact]
    public async Task ArchitectureNarrative_empty_manifest_still_emits_required_headers_without_legacy_placeholders()
    {
        ArchitectureNarrativeArtifactGenerator generator = new();
        SynthesizedArtifact artifact = await generator.GenerateAsync(
            new ManifestDocument
            {
                RunId = Guid.NewGuid(),
                ManifestId = Guid.NewGuid(),
                Metadata = new ArchLucid.Core.Manifest.Sections.ManifestMetadata { Name = "Empty Manifest" },
            },
            CancellationToken.None);

        ArchitectureMarkdownSectionValidator.GetMissingSectionHeaders(artifact.Content).Should().BeEmpty();
        artifact.Content.Should().NotContain("Architecture overview was not stored.");
        artifact.Content.Should().NotContain("Component breakdown was not stored.");
        artifact.Content.Should().NotContain("Data flow was not stored.");
        artifact.Content.Should().NotContain("Security model was not stored.");
        artifact.Content.Should().NotContain("Operational considerations were not stored.");
        artifact.Content.Should().NotContain("Not specified.");
    }

    [Fact]
    public void AppendRequiredProductSections_rejects_null_arguments()
    {
        Action nullBuilder = () => ArchitectureRequiredMarkdownSections.AppendRequiredProductSections(null!, new ManifestDocument());
        Action nullManifest = () => ArchitectureRequiredMarkdownSections.AppendRequiredProductSections(new StringBuilder(), null!);

        nullBuilder.Should().Throw<ArgumentNullException>().WithParameterName("sb");
        nullManifest.Should().Throw<ArgumentNullException>().WithParameterName("manifest");
    }

    [Fact]
    public void AppendRequiredProductSections_writes_typed_topology_and_cost_facts()
    {
        StringBuilder sb = new();
        ManifestDocument manifest = new()
        {
            Metadata = new ArchLucid.Core.Manifest.Sections.ManifestMetadata { Name = string.Empty },
            Topology = new TopologySection
            {
                Services =
                [
                    new ManifestService
                    {
                        ServiceId = "svc-orders",
                        ServiceName = "Orders API",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService,
                        Purpose = "Accepts checkout commands.",
                    },
                    new ManifestService { ServiceName = "   " },
                ],
                Datastores =
                [
                    new ManifestDatastore
                    {
                        DatastoreId = "db-orders",
                        DatastoreName = "Orders Database",
                        DatastoreType = DatastoreType.Sql,
                        RuntimePlatform = RuntimePlatform.SqlServer,
                    },
                ],
                Relationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "svc-orders",
                        TargetId = "db-orders",
                        RelationshipType = RelationshipType.WritesTo,
                        Description = "Persists orders.",
                    },
                    new ManifestRelationship { SourceId = " ", TargetId = "db-orders" },
                ],
            },
            Security = new SecuritySection
            {
                Controls = [new SecurityPostureItem { ControlId = " ", ControlName = " " }],
                Gaps = ["Missing WAF"],
            },
            Cost = new CostSection
            {
                MaxMonthlyCost = 42.5m,
                Notes = ["Reserved capacity preferred"],
            },
            UnresolvedIssues = new UnresolvedIssuesSection
            {
                Items =
                [
                    new ManifestIssue
                    {
                        IssueType = "ArchitectureGap",
                        Severity = "Medium",
                        Title = "CDN",
                        Description = "Edge not selected.",
                    },
                    new ManifestIssue { Title = " ", Description = " " },
                ],
            },
        };

        ArchitectureRequiredMarkdownSections.AppendRequiredProductSections(sb, manifest);

        string markdown = sb.ToString();
        markdown.Should().Contain("Objective was stored empty.");
        markdown.Should().Contain("Orders API (Api) — Accepts checkout commands.");
        markdown.Should().Contain("Service name was stored empty. (Service type was not stored.) — Service purpose was not stored.");
        markdown.Should().Contain("Relationship description was not stored.");
        markdown.Should().Contain("Orders Database (Sql, SqlServer)");
        markdown.Should().Contain(
            "Flow: Orders API -> Orders Database. Stored relationship type: WritesTo. Observed traffic was not stored. — Persists orders.");
        markdown.Should().Contain("Missing WAF");
        markdown.Should().Contain("Max Monthly Cost: 42.50");
        markdown.Should().Contain("Cost Currency: Cost currency was not stored.");
        markdown.Should().Contain("Reserved capacity preferred");
        markdown.Should().Contain("[Medium] ArchitectureGap CDN: Edge not selected.");
        markdown.Should().Contain("Issue title was not stored.");
        markdown.Should().Contain("Issue description was not stored.");
        ArchitectureMarkdownSectionValidator.GetMissingSectionHeaders(markdown)
            .Should()
            .Equal("Assumptions", "Constraints");
    }

    [Fact]
    public void AppendRequiredProductSections_labels_missing_topology_security_and_operational_sections()
    {
        StringBuilder sb = new();
        ArchitectureRequiredMarkdownSections.AppendRequiredProductSections(
            sb,
            new ManifestDocument
            {
                Topology = null!,
                Security = null!,
                Cost = null!,
                UnresolvedIssues = null!,
            });

        string markdown = sb.ToString();
        markdown.Should().Contain("Topology section was not stored.");
        markdown.Should().Contain("Security section was not stored.");
        markdown.Should().Contain("Operational considerations were not stored.");
        markdown.Should().NotContain("Data-plane resource:");
    }

    [Fact]
    public async Task ArchitectureNarrative_required_sections_include_committed_manifest_facts()
    {
        ArchitectureNarrativeArtifactGenerator generator = new();
        SynthesizedArtifact artifact = await generator.GenerateAsync(CreatePopulatedManifest(), CancellationToken.None);

        artifact.Content.Should().Contain("## Objective");
        artifact.Content.Should().Contain("Checkout modernization for retail.");
        artifact.Content.Should().Contain("## Architecture Overview");
        artifact.Content.Should().Contain("Hub-spoke");
        artifact.Content.Should().Contain("## Component Breakdown");
        artifact.Content.Should().Contain("checkout-api");
        artifact.Content.Should().Contain("## Data Flow");
        artifact.Content.Should().Contain("checkout-api");
        artifact.Content.Should().Contain("## Security Model");
        artifact.Content.Should().Contain("TLS 1.2+");
        artifact.Content.Should().Contain("## Operational Considerations");
        artifact.Content.Should().Contain("Idle dev/test capacity");
    }

    private static ManifestDocument CreatePopulatedManifest()
    {
        return new ManifestDocument
        {
            RunId = Guid.NewGuid(),
            ManifestId = Guid.NewGuid(),
            Metadata = new ArchLucid.Core.Manifest.Sections.ManifestMetadata
            {
                Name = "Retail Checkout",
                Summary = "Checkout modernization for retail.",
            },
            Topology = new TopologySection
            {
                SelectedPatterns = ["Hub-spoke"],
                Resources = ["checkout-api"],
                Gaps = ["No CDN edge"],
            },
            Security = new SecuritySection
            {
                Controls =
                [
                    new SecurityPostureItem
                    {
                        ControlId = "SC-8",
                        ControlName = "TLS 1.2+",
                        Status = "Required",
                        Impact = "High",
                    },
                ],
            },
            Cost = new CostSection { CostRisks = ["Idle dev/test capacity"] },
            Assumptions = ["Existing SQL database will be reused for orders."],
            Constraints = new ConstraintSection { MandatoryConstraints = ["Must stay in Canada Central"] },
        };
    }

    private static ArtifactBundle BundleOf(SynthesizedArtifact artifact)
    {
        return new ArtifactBundle
        {
            BundleId = Guid.NewGuid(),
            ManifestId = artifact.ManifestId,
            Artifacts = [artifact],
        };
    }
}
