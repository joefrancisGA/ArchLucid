using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Retrieval.Embedding;
using ArchLucid.Retrieval.Indexing;
using ArchLucid.Retrieval.Models;
using ArchLucid.Retrieval.Pricing;

using FluentAssertions;

namespace ArchLucid.Retrieval.Tests;

/// <summary>RC29d package-coverage batch: document builders, fake embeddings, and retail grounding flags.</summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RetrievalPackageCoverageBatchRc29dTests
{
    [Fact]
    public async Task FakeEmbeddingService_returns_deterministic_vectors_for_single_and_batch_inputs()
    {
        FakeEmbeddingService sut = new();

        float[] single = await sut.EmbedAsync("hello", CancellationToken.None);
        IReadOnlyList<float[]> batch = await sut.EmbedManyAsync(["hello", "world"], CancellationToken.None);

        single.Should().HaveCount(32);
        batch.Should().HaveCount(2);
        batch[0].Should().BeEquivalentTo(single);
        batch[1].Should().NotBeEquivalentTo(single);
    }

    [Fact]
    public void PriorManifestRetrievalDocumentBuilder_BuildFromFindings_skips_muted_and_blank_findings()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid workspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Guid projectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        Guid manifestId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        DateTime createdUtc = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        List<Finding> findings = [
            new Finding
            {
                FindingId = "f-1",
                Category = "Security",
                Severity = FindingSeverity.Critical,
                Title = "open ingress",
                Rationale = "ingress is public",
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

        IReadOnlyList<RetrievalDocument> documents = PriorManifestRetrievalDocumentBuilder.BuildFromFindings(
            tenantId,
            workspaceId,
            projectId,
            runId,
            manifestId,
            findings,
            createdUtc);

        documents.Should().ContainSingle();
        documents[0].SourceType.Should().Be("PriorManifestFinding");
        documents[0].FindingId.Should().Be("f-1");
        documents[0].CorpusKind.Should().Be(CorpusKind.PriorManifest);
    }

    [Fact]
    public void RetrievalDocumentBuilder_BuildForManifest_includes_manifest_and_decision_documents()
    {
        RetrievalDocumentBuilder builder = new();
        ManifestDocument manifest = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            RunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            ManifestId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
            Metadata = new ManifestMetadata { Name = "golden" },
            CreatedUtc = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            ManifestHash = "hash-1",
            Decisions = [
                new ResolvedArchitectureDecision
                {
                    DecisionId = "d-1",
                    Title = "Use WAF",
                    Category = "Security",
                    SelectedOption = "Azure WAF",
                    Rationale = "ingress protection",
                },
            ],
        };

        IReadOnlyList<RetrievalDocument> documents = builder.BuildForManifest(manifest);

        documents.Should().HaveCount(2);
        documents[0].SourceType.Should().Be("Manifest");
        documents[1].SourceType.Should().Be("ManifestDecision");
        documents[1].Title.Should().Be("Use WAF");
    }

    [Fact]
    public void CostRetailGroundingResult_exposes_missing_and_skipped_flags()
    {
        CostRetailGroundingResult missing = new(
            string.Empty,
            [],
            true,
            false,
            null);

        CostRetailGroundingResult skipped = new(
            "block",
            [],
            false,
            true,
            CloudProvider.Azure);

        missing.GroundingMissing.Should().BeTrue();
        skipped.SkippedRetailGrounding.Should().BeTrue();
        skipped.GroundedProvider.Should().Be(CloudProvider.Azure);
    }
}
