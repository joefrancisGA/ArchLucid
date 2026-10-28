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

        documents.Should().HaveCount(4);
        documents.Should().Contain(d => d.SourceType == "Manifest");
        documents.Should().Contain(d => d.SourceType == "ManifestMandatedMarkdown");
        documents.Should().Contain(d => d.SourceType == "ManifestDecision" && d.SourceId == "d1");
        documents.Should().Contain(d => d.SourceType == "ManifestTopology");
    }

    [Fact]
    public void BuildForManifest_missing_decision_id_is_stable_across_rebuilds()
    {
        Guid runId = Guid.NewGuid();
        ManifestDocument manifest = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            RunId = runId,
            ManifestId = Guid.NewGuid(),
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
                    DecisionId = null!,
                    Title = "Use private endpoints",
                    Category = "Security",
                    SelectedOption = "Private Link",
                    Rationale = "Reduce public exposure.",
                },
            ],
        };

        RetrievalDocumentBuilder sut = new();

        string firstDocumentId = sut.BuildForManifest(manifest)
            .Single(document => document.SourceType == "ManifestDecision")
            .DocumentId;
        string secondDocumentId = sut.BuildForManifest(manifest)
            .Single(document => document.SourceType == "ManifestDecision")
            .DocumentId;

        secondDocumentId.Should().Be(firstDocumentId);
    }

    [Fact]
    public void BuildForManifest_missing_decision_id_uses_emitted_ordinal_not_raw_list_index()
    {
        Guid runId = Guid.NewGuid();
        Guid manifestId = Guid.NewGuid();
        ResolvedArchitectureDecision activeDecision = new()
        {
            DecisionId = null!,
            Title = "Use private endpoints",
            Category = "Security",
            SelectedOption = "Private Link",
            Rationale = "Reduce public exposure.",
        };

        List<ResolvedArchitectureDecision> withLeadingBlankTitle =
        [
            new()
            {
                DecisionId = null!,
                Title = "   ",
                Category = "Cost",
                SelectedOption = "Skip",
                Rationale = "Blank title row should not shift generated identity.",
            },
            activeDecision,
        ];

        ManifestDocument withLeadingBlank = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            RunId = runId,
            ManifestId = manifestId,
            CreatedUtc = DateTime.UtcNow,
            ManifestHash = "hash",
            RuleSetId = "rules",
            RuleSetVersion = "1",
            RuleSetHash = "rh",
            Metadata = new ArchLucid.Core.Manifest.Sections.ManifestMetadata { Name = "Retail API" },
            Decisions = withLeadingBlankTitle,
        };

        ManifestDocument solo = new()
        {
            TenantId = withLeadingBlank.TenantId,
            WorkspaceId = withLeadingBlank.WorkspaceId,
            ProjectId = withLeadingBlank.ProjectId,
            RunId = runId,
            ManifestId = manifestId,
            CreatedUtc = withLeadingBlank.CreatedUtc,
            ManifestHash = withLeadingBlank.ManifestHash,
            RuleSetId = withLeadingBlank.RuleSetId,
            RuleSetVersion = withLeadingBlank.RuleSetVersion,
            RuleSetHash = withLeadingBlank.RuleSetHash,
            Metadata = withLeadingBlank.Metadata,
            Decisions = [activeDecision],
        };

        RetrievalDocumentBuilder sut = new();

        string withLeadingBlankDocumentId = sut.BuildForManifest(withLeadingBlank)
            .Single(document => document.SourceType == "ManifestDecision")
            .DocumentId;

        string soloDocumentId = sut.BuildForManifest(solo)
            .Single(document => document.SourceType == "ManifestDecision")
            .DocumentId;

        soloDocumentId.Should().Be(withLeadingBlankDocumentId);
    }

    [Fact]
    public void BuildForManifest_indexes_mandated_markdown_and_honest_topology_summary()
    {
        ManifestDocument manifest = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            ManifestId = Guid.NewGuid(),
            CreatedUtc = DateTime.UtcNow,
            ManifestHash = "hash",
            RuleSetId = "rules",
            RuleSetVersion = "1",
            RuleSetHash = "rh",
            Metadata = new ArchLucid.Core.Manifest.Sections.ManifestMetadata { Name = "Retail API" },
            Topology = new TopologySection
            {
                Services = [new ManifestService { ServiceName = "api", ServiceType = ServiceType.Api }],
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

        RetrievalDocument mandated = documents.Single(d => d.SourceType == "ManifestMandatedMarkdown");
        mandated.Content.Should().Contain("## Data Flow");
        mandated.Content.Should().Contain("- api ReadsFrom sql");

        RetrievalDocument topology = documents.Single(d => d.SourceType == "ManifestTopology");
        topology.Content.Should().Contain("Datastores were not listed on this snapshot.");
    }

    [Fact]
    public void BuildForFindings_missing_finding_id_is_stable_across_rebuilds()
    {
        Guid runId = Guid.NewGuid();
        List<Finding> findings =
        [
            new()
            {
                FindingId = null!,
                Category = "Security",
                Severity = FindingSeverity.Error,
                Rationale = "Use private endpoints.",
            },
        ];

        RetrievalDocumentBuilder sut = new();

        string firstDocumentId = sut.BuildForFindings(
                Guid.NewGuid(),
                Guid.NewGuid(),
                Guid.NewGuid(),
                runId,
                Guid.NewGuid(),
                findings,
                DateTime.UtcNow)
            .Single()
            .DocumentId;
        string secondDocumentId = sut.BuildForFindings(
                Guid.NewGuid(),
                Guid.NewGuid(),
                Guid.NewGuid(),
                runId,
                Guid.NewGuid(),
                findings,
                DateTime.UtcNow)
            .Single()
            .DocumentId;

        secondDocumentId.Should().Be(firstDocumentId);
    }

    [Fact]
    public void BuildForFindings_missing_finding_id_uses_emitted_ordinal_not_raw_list_index()
    {
        Guid runId = Guid.NewGuid();
        Finding activeFinding = new()
        {
            FindingId = null!,
            Category = "Security",
            Severity = FindingSeverity.Error,
            Rationale = "Use private endpoints.",
        };

        List<Finding> withLeadingMuted =
        [
            new()
            {
                FindingId = "muted-only",
                Category = "Cost",
                Severity = FindingSeverity.Warning,
                Rationale = "Muted row should not shift generated identity.",
                IsMuted = true,
            },
            activeFinding,
        ];

        RetrievalDocumentBuilder sut = new();

        string withMutedDocumentId = sut.BuildForFindings(
                Guid.NewGuid(),
                Guid.NewGuid(),
                Guid.NewGuid(),
                runId,
                Guid.NewGuid(),
                withLeadingMuted,
                DateTime.UtcNow)
            .Single()
            .DocumentId;

        string soloDocumentId = sut.BuildForFindings(
                Guid.NewGuid(),
                Guid.NewGuid(),
                Guid.NewGuid(),
                runId,
                Guid.NewGuid(),
                [activeFinding],
                DateTime.UtcNow)
            .Single()
            .DocumentId;

        soloDocumentId.Should().Be(withMutedDocumentId);
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
    public void BuildForArtifacts_collapses_duplicate_artifact_ids_to_last_entry()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();
        Guid manifestId = Guid.NewGuid();
        Guid artifactId = Guid.NewGuid();

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
                    Name = "summary-v1.json",
                    Content = "first",
                    ContentHash = "hash-v1",
                    CreatedUtc = new DateTime(2026, 7, 9, 12, 0, 0, DateTimeKind.Utc),
                },
                new SynthesizedArtifact
                {
                    ArtifactId = artifactId,
                    RunId = runId,
                    ManifestId = manifestId,
                    Name = "summary-v2.json",
                    Content = "second",
                    ContentHash = "hash-v2",
                    CreatedUtc = new DateTime(2026, 7, 9, 12, 5, 0, DateTimeKind.Utc),
                },
            ]);

        artifacts.Should().ContainSingle();
        artifacts[0].Content.Should().Be("second");
        artifacts[0].ContentHash.Should().Be("hash-v2");
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
