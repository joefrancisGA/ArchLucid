using ArchLucid.Application.Diagrams;
using ArchLucid.Application.Manifests;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Diagrams;

[Trait("Suite", "Application")]
public sealed class MermaidDiagramGeneratorHonestyTests
{
    [Fact]
    public void GenerateMermaid_unknown_runtime_platform_and_blank_service_name_use_not_stored_labels()
    {
        MermaidDiagramGenerator sut = new();
        GoldenManifest manifest = new()
        {
            SystemName = "Sys",
            Services =
            [
                new ManifestService
                {
                    ServiceId = "api",
                    ServiceName = "  ",
                    ServiceType = ServiceType.Api,
                    RuntimePlatform = RuntimePlatform.Unknown,
                },
            ],
        };

        string mermaid = sut.GenerateMermaid(manifest);

        mermaid.Should().Contain("Service name was not stored.");
        mermaid.Should().Contain("Runtime platform was not stored.");
    }

    [Fact]
    public void GenerateMermaid_datastore_private_endpoint_uses_observed_use_honesty_not_bare_private_endpoint()
    {
        MermaidDiagramGenerator sut = new();
        GoldenManifest manifest = new()
        {
            SystemName = "Sys",
            Datastores =
            [
                new ManifestDatastore
                {
                    DatastoreId = "db",
                    DatastoreName = "Ledger",
                    DatastoreType = DatastoreType.Sql,
                    RuntimePlatform = RuntimePlatform.SqlServer,
                    PrivateEndpointRequired = true,
                },
            ],
        };

        string mermaid = sut.GenerateMermaid(manifest);

        mermaid.Should().Contain(ArchitectureManifestDatastoreExport.PrivateEndpointRequiredOmissionLabel);
        mermaid.Should().NotContain("\\nPrivate Endpoint");
    }

    [Fact]
    public void GenerateMermaid_relationship_edge_uses_stored_link_sentence_not_enum_name()
    {
        MermaidDiagramGenerator sut = new();
        GoldenManifest manifest = new()
        {
            SystemName = "Sys",
            Services =
            [
                new ManifestService
                {
                    ServiceId = "a",
                    ServiceName = "A",
                    RuntimePlatform = RuntimePlatform.AppService,
                },
                new ManifestService
                {
                    ServiceId = "b",
                    ServiceName = "B",
                    RuntimePlatform = RuntimePlatform.AppService,
                },
            ],
            Relationships =
            [
                new ManifestRelationship
                {
                    SourceId = "a",
                    TargetId = "b",
                    RelationshipType = RelationshipType.Calls,
                },
            ],
        };

        string mermaid = sut.GenerateMermaid(manifest);

        mermaid.Should().NotContain("-->|Calls|");
        mermaid.Should().Contain("stored call link");
    }

    [Fact]
    public void GenerateMermaid_undefined_relationship_type_uses_not_stored_label()
    {
        MermaidDiagramGenerator sut = new();
        GoldenManifest manifest = new()
        {
            SystemName = "Sys",
            Services =
            [
                new ManifestService { ServiceId = "a", ServiceName = "A", RuntimePlatform = RuntimePlatform.AppService },
                new ManifestService { ServiceId = "b", ServiceName = "B", RuntimePlatform = RuntimePlatform.AppService },
            ],
            Relationships =
            [
                new ManifestRelationship
                {
                    SourceId = "a",
                    TargetId = "b",
                    RelationshipType = (RelationshipType)0,
                },
            ],
        };

        string mermaid = sut.GenerateMermaid(manifest);

        mermaid.Should().Contain("Relationship type was not stored.");
    }
}
