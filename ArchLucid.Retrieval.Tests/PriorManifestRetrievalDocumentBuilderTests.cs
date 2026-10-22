using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Common;
using ArchLucid.Retrieval.Indexing;
using ArchLucid.Retrieval.Models;

using FluentAssertions;

namespace ArchLucid.Retrieval.Tests;

[Trait("Category", "Unit")]
public sealed class PriorManifestRetrievalDocumentBuilderTests
{
    [Fact]
    public void BuildFromFindings_skips_muted_and_empty_messages()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();
        Guid manifestId = Guid.NewGuid();
        DateTime createdUtc = new(2026, 5, 24, 12, 0, 0, DateTimeKind.Utc);

        List<Finding> findings =
        [
            new()
            {
                FindingId = "active-1",
                Category = "Cost",
                Severity = FindingSeverity.Warning,
                Rationale = "Right-size underused VM.",
            },
            new()
            {
                FindingId = "muted-1",
                Category = "Security",
                Severity = FindingSeverity.Error,
                Rationale = "Should not index.",
                IsMuted = true,
            },
            new()
            {
                FindingId = "empty-1",
                Category = "Topology",
                Severity = FindingSeverity.Info,
                Title = string.Empty,
                Rationale = "   ",
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
        RetrievalDocument doc = documents[0];
        doc.TenantId.Should().Be(tenantId);
        doc.CorpusKind.Should().Be(CorpusKind.PriorManifest);
        doc.SourceType.Should().Be("PriorManifestFinding");
        doc.SourceId.Should().Be("active-1");
        doc.Content.Should().Contain("Right-size underused VM.");
        doc.ContentHash.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public void BuildFromFindings_missing_finding_id_is_stable_across_rebuilds()
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

        string firstDocumentId = PriorManifestRetrievalDocumentBuilder
            .BuildFromFindings(
                Guid.NewGuid(),
                Guid.NewGuid(),
                Guid.NewGuid(),
                runId,
                Guid.NewGuid(),
                findings,
                DateTime.UtcNow)
            .Single()
            .DocumentId;
        string secondDocumentId = PriorManifestRetrievalDocumentBuilder
            .BuildFromFindings(
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
    public void BuildFromFindings_missing_finding_id_uses_emitted_ordinal_not_raw_list_index()
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

        string withMutedDocumentId = PriorManifestRetrievalDocumentBuilder.BuildFromFindings(
                Guid.NewGuid(),
                Guid.NewGuid(),
                Guid.NewGuid(),
                runId,
                Guid.NewGuid(),
                withLeadingMuted,
                DateTime.UtcNow)
            .Single()
            .DocumentId;

        string soloDocumentId = PriorManifestRetrievalDocumentBuilder.BuildFromFindings(
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
}
