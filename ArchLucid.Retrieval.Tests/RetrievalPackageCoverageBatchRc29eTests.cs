using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Persistence.Artifacts;
using ArchLucid.Core.Conversation;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Decisioning.Models;
using ArchLucid.Provenance;
using ArchLucid.Retrieval.Indexing;
using ArchLucid.Retrieval.Models;

using FluentAssertions;

namespace ArchLucid.Retrieval.Tests;

/// <summary>RC29e package-coverage batch: document builder paths for topology, artifacts, conversation, and findings.</summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RetrievalPackageCoverageBatchRc29eTests
{
  [Fact]
  public void RetrievalDocumentBuilder_BuildForManifest_includes_topology_document()
  {
    RetrievalDocumentBuilder builder = new();
    Guid manifestId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    ManifestDocument manifest = new()
    {
      TenantId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
      WorkspaceId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
      ProjectId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
      RunId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
      ManifestId = manifestId,
      Metadata = new ArchLucid.Core.Manifest.Sections.ManifestMetadata { Name = "golden" },
      CreatedUtc = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
      ManifestHash = "hash-1",
      Topology = new TopologySection
      {
        Services = [new ManifestService { ServiceName = "api-gateway" }],
        Datastores = [new ManifestDatastore { DatastoreName = "orders-db" }],
        Relationships = [new ManifestRelationship { RelationshipId = "rel-1" }],
      },
    };

    IReadOnlyList<RetrievalDocument> documents = builder.BuildForManifest(manifest);

    documents.Should().Contain(d => d.SourceType == "ManifestTopology");
    RetrievalDocument topology = documents.Single(d => d.SourceType == "ManifestTopology");
    topology.Content.Should().Contain("api-gateway");
    topology.Content.Should().Contain("orders-db");
    topology.Title.Should().Be("Topology");
  }

  [Fact]
  public void RetrievalDocumentBuilder_BuildForArtifacts_maps_synthesized_artifact_rows()
  {
    RetrievalDocumentBuilder builder = new();
    Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    Guid workspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    Guid projectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
    Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
    Guid manifestId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
  Guid artifactId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    SynthesizedArtifact artifact = new()
    {
      ArtifactId = artifactId,
      RunId = runId,
      ManifestId = manifestId,
      CreatedUtc = new DateTime(2026, 1, 2, 0, 0, 0, DateTimeKind.Utc),
      ArtifactType = "Inventory",
      Name = "inventory.json",
      Format = "json",
      Content = "{\"Items\":[]}",
      ContentHash = "hash-artifact",
    };

    IReadOnlyList<RetrievalDocument> documents = builder.BuildForArtifacts(
      tenantId,
      workspaceId,
      projectId,
      [artifact]);

    documents.Should().ContainSingle();
    documents[0].SourceType.Should().Be("Artifact");
    documents[0].DocumentId.Should().Be($"artifact-{artifactId:N}");
    documents[0].Title.Should().Be("inventory.json");
    documents[0].CorpusKind.Should().Be(CorpusKind.TenantManifest);
  }

  [Fact]
  public void RetrievalDocumentBuilder_BuildForConversation_maps_message_turns()
  {
    RetrievalDocumentBuilder builder = new();
    Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    Guid workspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    Guid projectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
    Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
    Guid messageId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

    ConversationMessage message = new()
    {
      MessageId = messageId,
      ThreadId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff"),
      Role = "user",
      Content = "What changed in ingress controls?",
      CreatedUtc = new DateTime(2026, 1, 3, 0, 0, 0, DateTimeKind.Utc),
    };

    IReadOnlyList<RetrievalDocument> documents = builder.BuildForConversation(
      tenantId,
      workspaceId,
      projectId,
      runId,
      [message]);

    documents.Should().ContainSingle();
    documents[0].SourceType.Should().Be("ConversationMessage");
    documents[0].CorpusKind.Should().Be(CorpusKind.Conversation);
    documents[0].Content.Should().Contain("ingress");
  }

  [Fact]
  public void RetrievalDocumentBuilder_BuildForProvenance_serializes_graph_summary()
  {
    RetrievalDocumentBuilder builder = new();
    Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    Guid workspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    Guid projectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
    Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

    DecisionProvenanceGraph graph = new()
    {
      Id = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
      RunId = runId,
      Nodes = [new ProvenanceNode { ReferenceId = "node-1", Name = "Ingress WAF" }],
      Edges = [],
    };

    IReadOnlyList<RetrievalDocument> documents = builder.BuildForProvenance(
      tenantId,
      workspaceId,
      projectId,
      runId,
      graph);

    documents.Should().ContainSingle();
    documents[0].SourceType.Should().Be("ProvenanceGraph");
    documents[0].Content.Should().Contain("Ingress WAF");
    documents[0].Title.Should().Contain(runId.ToString());
  }

  [Fact]
  public void RetrievalDocumentBuilder_BuildForFindings_skips_muted_and_blank_rows()
  {
    RetrievalDocumentBuilder builder = new();
    Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    Guid workspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    Guid projectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
    Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
    Guid manifestId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
    DateTime createdUtc = new(2026, 1, 4, 0, 0, 0, DateTimeKind.Utc);

    List<Finding> findings = [
      new Finding
      {
        FindingId = "f-1",
        Category = "Security",
        Severity = FindingSeverity.Critical,
        Title = "open port",
        Rationale = "port 22 exposed",
        IsMuted = false,
      },
      new Finding
      {
        FindingId = "f-muted",
        Category = "Security",
        Severity = FindingSeverity.Info,
        Title = "muted",
        Rationale = "muted",
        IsMuted = true,
      },
      new Finding
      {
        FindingId = "f-blank",
        Category = "Security",
        Severity = FindingSeverity.Info,
        Title = "   ",
        Rationale = "   ",
        IsMuted = false,
      },
    ];

    IReadOnlyList<RetrievalDocument> documents = builder.BuildForFindings(
      tenantId,
      workspaceId,
      projectId,
      runId,
      manifestId,
      findings,
      createdUtc);

    documents.Should().ContainSingle();
    documents[0].SourceType.Should().Be("ManifestFinding");
    documents[0].FindingId.Should().Be("f-1");
    documents[0].Content.Should().Contain("port 22 exposed");
  }
}
