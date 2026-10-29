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

        markdown.ToString().Should().Contain("- checkout-api has a stored write link. An observed write was not stored. orders-sql");
    }

    [Fact]
    public void Append_objective_does_not_substitute_system_name_for_missing_summary()
    {
        ManifestDocument manifest = new()
        {
            Metadata = new CoreManifestMetadata { Name = "Checkout platform", Summary = string.Empty },
        };
        StringBuilder markdown = new();

        ArchitectureMandatedMarkdownSections.Append(markdown, manifest);

        string content = markdown.ToString();
        content.Should().Contain("Objective was stored empty.");
        content.Should().NotContain("Checkout platform");
    }

    [Fact]
    public void Append_labels_unknown_service_and_datastore_types_as_not_stored()
    {
        ManifestDocument manifest = new()
        {
            Topology = new TopologySection
            {
                Services = [new ManifestService { ServiceName = "api", ServiceType = ServiceType.Unknown }],
                Datastores = [new ManifestDatastore { DatastoreName = "db", DatastoreType = DatastoreType.Unknown }],
            },
        };
        StringBuilder markdown = new();

        ArchitectureMandatedMarkdownSections.Append(markdown, manifest);

        string content = markdown.ToString();
        content.Should().Contain("Service type stored as Unknown.");
        content.Should().Contain("Datastore type stored as Unknown.");
        content.Should().NotContain("(Unknown)");
    }

    [Fact]
    public void Append_labels_blank_service_and_datastore_names_as_stored_empty()
    {
        ManifestDocument manifest = new()
        {
            Topology = new TopologySection
            {
                Services = [new ManifestService { ServiceName = "  ", ServiceType = ServiceType.Api }],
                Datastores = [new ManifestDatastore { DatastoreName = "", DatastoreType = DatastoreType.Sql }],
            },
        };
        StringBuilder markdown = new();

        ArchitectureMandatedMarkdownSections.Append(markdown, manifest);

        string content = markdown.ToString();
        content.Should().Contain("Service name was stored empty.");
        content.Should().Contain("Datastore name was stored empty.");
    }

    [Fact]
    public void Append_labels_missing_relationship_endpoints_and_type()
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
                        RelationshipType = default,
                    },
                ],
            },
        };
        StringBuilder markdown = new();

        ArchitectureMandatedMarkdownSections.Append(markdown, manifest);

        markdown.ToString().Should().Contain("Relationship source id was not stored.");
        markdown.ToString().Should().Contain("Relationship type stored as Unknown.");
    }

    [Fact]
    public void Append_labels_blank_security_control_identity_fields()
    {
        ManifestDocument manifest = new()
        {
            Security = new SecuritySection
            {
                Controls =
                [
                    new SecurityPostureItem
                    {
                        ControlId = "",
                        ControlName = "  ",
                        Impact = "High",
                        Status = "Implemented",
                    },
                ],
            },
        };
        StringBuilder markdown = new();

        ArchitectureMandatedMarkdownSections.Append(markdown, manifest);

        string content = markdown.ToString();
        content.Should().Contain("Control id was not stored.");
        content.Should().Contain("Control name was not stored.");
    }

    [Fact]
    public void Append_operational_section_labels_missing_max_monthly_cost()
    {
        ManifestDocument manifest = new()
        {
            Cost = new CostSection(),
        };
        StringBuilder markdown = new();

        ArchitectureMandatedMarkdownSections.Append(markdown, manifest);

        markdown.ToString().Should().Contain("Max monthly cost was not stored.");
    }

    [Fact]
    public void Append_labels_blank_resource_and_empty_topology_lists()
    {
        ManifestDocument manifest = new()
        {
            Topology = new TopologySection
            {
                Resources = ["   "],
                Relationships = [],
                Gaps = [],
            },
        };
        StringBuilder markdown = new();

        ArchitectureMandatedMarkdownSections.Append(markdown, manifest);

        string content = markdown.ToString();
        content.Should().Contain("- Resource: Resource was stored empty.");
        content.Should().Contain("Data-flow relationships were stored as an empty list.");
        content.Should().Contain("Topology gaps were stored as an empty list.");
    }

    [Fact]
    public void Append_labels_null_topology_services_datastores_and_controls()
    {
        ManifestDocument manifest = new()
        {
            Topology = new TopologySection
            {
                Services = null!,
                Datastores = null!,
            },
            Security = new SecuritySection
            {
                Controls = null!,
            },
        };
        StringBuilder markdown = new();

        ArchitectureMandatedMarkdownSections.Append(markdown, manifest);

        string content = markdown.ToString();
        content.Should().Contain("- Services were not stored.");
        content.Should().Contain("- Datastores were not stored.");
        content.Should().Contain("Security controls were not stored.");
    }

    [Fact]
    public void Append_appends_relationship_description_honesty_suffix()
    {
        ManifestDocument manifest = new()
        {
            Topology = new TopologySection
            {
                Relationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "svc-a",
                        TargetId = "ds-1",
                        RelationshipType = RelationshipType.ReadsFrom,
                        Description = null,
                    },
                ],
            },
        };
        StringBuilder markdown = new();

        ArchitectureMandatedMarkdownSections.Append(markdown, manifest);

        markdown.ToString().Should().Contain("Relationship description was not stored.");
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
