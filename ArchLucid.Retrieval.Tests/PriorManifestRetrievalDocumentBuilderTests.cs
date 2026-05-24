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
        doc.CorpusKind.Should().Be(CorpusKind.TenantManifest);
        doc.SourceType.Should().Be("PriorManifestFinding");
        doc.SourceId.Should().Be("active-1");
        doc.Content.Should().Contain("Right-size underused VM.");
        doc.ContentHash.Should().NotBeNullOrWhiteSpace();
    }
}
