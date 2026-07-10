using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Persistence.Artifacts;
using ArchLucid.Core.Conversation;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Provenance;
using ArchLucid.Retrieval.Indexing;
using ArchLucid.Retrieval.Models;

using FluentAssertions;

namespace ArchLucid.Retrieval.Tests;

[Trait("Category", "Unit")]
public sealed class RetrievalDocumentBuilderTests
{
    [Fact]
    public void BuildForManifest_includes_decisions_topology_and_skips_blank_titles()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();
        Guid manifestId = Guid.NewGuid();

        ManifestDocument manifest = new()
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            RunId = runId,
            ManifestId = manifestId,
            CreatedUtc = new DateTime(2026, 7, 9, 12, 0, 0, DateTimeKind.Utc),
            ManifestHash = "hash",
            RuleSetId = "rules",
            RuleSetVersion = "1",
            RuleSetHash = "rh",
            Metadata = new ArchLucid.Core.Manifest.Sections.ManifestMetadata { Name = "Retail API" },
            Decisions =
            [
                new ResolvedArchitectureDecision
                {
                    DecisionId = "d1",
                    Title = "Use private endpoints",
                    Category = "Security",
                    SelectedOption = "Private Link",
                    Rationale = "Reduce public exposure.",
                },
                new ResolvedArchitectureDecision { Title = "   " },
            ],
            Topology = new TopologySection
            {
                Services =
                [
                    new ManifestService
                    {
                        ServiceName = "api",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService,
                    },
                ],
                Datastores = [new ManifestDatastore { DatastoreName = "sql" }],
                Relationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = "api",
                        TargetId = "sql",
                        RelationshipType = RelationshipType.ReadsFrom,
                    },
                ],
            },
        };

        RetrievalDocumentBuilder sut = new();

        IReadOnlyList<RetrievalDocument> documents = sut.BuildForManifest(manifest);

        documents.Should().HaveCount(3);
        documents.Should().Contain(d => d.SourceType == "Manifest");
        documents.Should().Contain(d => d.SourceType == "ManifestDecision" && d.SourceId == "d1");
        documents.Should().Contain(d => d.SourceType == "ManifestTopology");
    }

    [Fact]
    public void BuildForFindings_skips_muted_and_empty_messages()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();
        Guid manifestId = Guid.NewGuid();
        DateTime createdUtc = new(2026, 7, 9, 12, 0, 0, DateTimeKind.Utc);

        List<Finding> findings =
        [
            new()
            {
                FindingId = "f1",
                Category = "Cost",
                Severity = FindingSeverity.Warning,
                Rationale = "Resize the VM.",
            },
            new()
            {
                FindingId = "muted",
                Category = "Security",
                Severity = FindingSeverity.Error,
                Rationale = "hidden",
                IsMuted = true,
            },
        ];

        RetrievalDocumentBuilder sut = new();

        IReadOnlyList<RetrievalDocument> documents = sut.BuildForFindings(
            tenantId,
            workspaceId,
            projectId,
            runId,
            manifestId,
            findings,
            createdUtc);

        documents.Should().ContainSingle();
        documents[0].FindingId.Should().Be("f1");
    }

    [Fact]
    public void BuildForArtifacts_and_conversation_map_source_metadata()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();
        Guid manifestId = Guid.NewGuid();
        Guid artifactId = Guid.NewGuid();
        Guid messageId = Guid.NewGuid();

        RetrievalDocumentBuilder sut = new();

        IReadOnlyList<RetrievalDocument> artifacts = sut.BuildForArtifacts(
            tenantId,
            workspaceId,
            projectId,
            [
                new SynthesizedArtifact
                {
                    ArtifactId = artifactId,
                    RunId = runId,
                    ManifestId = manifestId,
                    Name = "summary.json",
                    Content = "{}",
                    ContentHash = "ah",
                    CreatedUtc = new DateTime(2026, 7, 9, 12, 0, 0, DateTimeKind.Utc),
                },
            ]);

        IReadOnlyList<RetrievalDocument> conversation = sut.BuildForConversation(
            tenantId,
            workspaceId,
            projectId,
            runId,
            [
                new ConversationMessage
                {
                    MessageId = messageId,
                    Role = "user",
                    Content = "Explain the topology.",
                    CreatedUtc = new DateTime(2026, 7, 9, 12, 1, 0, DateTimeKind.Utc),
                },
            ]);

        artifacts.Should().ContainSingle();
        artifacts[0].DocumentId.Should().Be($"artifact-{artifactId:N}");
        conversation.Should().ContainSingle();
        conversation[0].CorpusKind.Should().Be(CorpusKind.Conversation);
    }

    [Fact]
    public void BuildForProvenance_emits_single_graph_summary_document()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();

        RetrievalDocumentBuilder sut = new();

        IReadOnlyList<RetrievalDocument> documents = sut.BuildForProvenance(
            tenantId,
            workspaceId,
            projectId,
            runId,
            new DecisionProvenanceGraph { RunId = runId });

        documents.Should().ContainSingle();
        documents[0].SourceType.Should().Be("ProvenanceGraph");
        documents[0].Title.Should().Contain(runId.ToString());
    }
}
