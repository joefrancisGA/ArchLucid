using System.Text;

using ArchLucid.ArtifactSynthesis.Generators;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Services;
using ArchLucid.ArtifactSynthesis.Validation;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;

using CoreManifestMetadata = ArchLucid.Core.Manifest.Sections.ManifestMetadata;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArchitectureMandatedMarkdownSectionsTests
{
    [Fact]
    public void Append_when_builder_is_null_throws()
    {
        Action act = () => ArchitectureMandatedMarkdownSections.Append(null!, new ManifestDocument());

        act.Should().Throw<ArgumentNullException>().WithParameterName("markdown");
    }

    [Fact]
    public void Append_when_manifest_is_null_throws()
    {
        Action act = () => ArchitectureMandatedMarkdownSections.Append(new StringBuilder(), null!);

        act.Should().Throw<ArgumentNullException>().WithParameterName("manifest");
    }

    [Fact]
    public void Append_empty_manifest_emits_every_required_second_level_header()
    {
        StringBuilder markdown = new();

        ArchitectureMandatedMarkdownSections.Append(markdown, new ManifestDocument());

        ArchitectureMarkdownSectionValidator.GetMissingSectionHeaders(markdown.ToString()).Should().BeEmpty();
    }

    [Fact]
    public void Append_does_not_emit_retired_not_stored_placeholders()
    {
        StringBuilder markdown = new();

        ArchitectureMandatedMarkdownSections.Append(markdown, new ManifestDocument());

        string content = markdown.ToString();
        content.Should().NotContain("Architecture overview was not stored.");
        content.Should().NotContain("Component breakdown was not stored.");
        content.Should().NotContain("Data flow was not stored.");
        content.Should().NotContain("Security model was not stored.");
        content.Should().NotContain("Operational considerations were not stored.");
        content.Should().NotContain("Not specified.");
    }

    [Fact]
    public void Append_labels_missing_relationship_endpoints_instead_of_placeholder_tokens()
    {
        ManifestDocument manifest = new()
        {
            Topology = new TopologySection
            {
                Relationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "",
                        TargetId = "orders-sql",
                        RelationshipType = RelationshipType.WritesTo,
                    },
                ],
            },
        };
        StringBuilder markdown = new();

        ArchitectureMandatedMarkdownSections.Append(markdown, manifest);

        markdown.ToString().Should().Contain("Relationship source id was not stored.");
    }

    [Fact]
    public void Append_uses_not_stored_service_and_datastore_names()
    {
        ManifestDocument manifest = new()
        {
            Topology = new TopologySection
            {
                Services =
                [
                    new ManifestService { ServiceId = "svc-1", ServiceName = "   " },
                ],
                Datastores =
                [
                    new ManifestDatastore { DatastoreId = "ds-1", DatastoreName = "" },
                ],
            },
        };
        StringBuilder markdown = new();

        ArchitectureMandatedMarkdownSections.Append(markdown, manifest);

        string content = markdown.ToString();
        content.Should().Contain("Service name was stored empty.");
        content.Should().Contain("Datastore name was stored empty.");
    }

    [Fact]
    public void Append_maps_topology_relationships_into_data_flow()
    {
        ManifestDocument manifest = new()
        {
            Topology = new TopologySection
            {
                Relationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "checkout-api",
                        TargetId = "orders-sql",
                        RelationshipType = RelationshipType.WritesTo,
                    },
                ],
            },
        };
        StringBuilder markdown = new();

        ArchitectureMandatedMarkdownSections.Append(markdown, manifest);

        markdown.ToString().Should().Contain("- checkout-api WritesTo orders-sql");
    }

    [Fact]
    public async Task ArchitectureNarrativeGenerator_output_passes_bundle_header_validation()
    {
        ArchitectureNarrativeArtifactGenerator generator = new();
        ManifestDocument manifest = new()
        {
            RunId = Guid.NewGuid(),
            ManifestId = Guid.NewGuid(),
            Metadata = new CoreManifestMetadata
            {
                Name = "Private beta access-path smoke",
                Summary = "Design a secure Azure RAG system for enterprise internal documents.",
            },
        };

        SynthesizedArtifact artifact = await generator.GenerateAsync(manifest, CancellationToken.None);

        ArchitectureMarkdownSectionValidator.GetMissingSectionHeaders(artifact.Content).Should().BeEmpty();
        Action validate = () => new ArtifactBundleValidator().Validate(
            new ArtifactBundle
            {
                BundleId = Guid.NewGuid(),
                ManifestId = manifest.ManifestId,
                Artifacts = [artifact],
            });
        validate.Should().NotThrow();
    }

    [Fact]
    public async Task ReferenceArchitectureGenerator_output_passes_bundle_header_validation()
    {
        ReferenceArchitectureMarkdownGenerator generator = new();
        ManifestDocument manifest = new()
        {
            RunId = Guid.NewGuid(),
            ManifestId = Guid.NewGuid(),
            Metadata = new CoreManifestMetadata { Name = "Private beta access-path smoke" },
        };

        SynthesizedArtifact artifact = await generator.GenerateAsync(manifest, CancellationToken.None);

        ArchitectureMarkdownSectionValidator.GetMissingSectionHeaders(artifact.Content).Should().BeEmpty();
        Action validate = () => new ArtifactBundleValidator().Validate(
            new ArtifactBundle
            {
                BundleId = Guid.NewGuid(),
                ManifestId = manifest.ManifestId,
                Artifacts = [artifact],
            });
        validate.Should().NotThrow();
    }
}
