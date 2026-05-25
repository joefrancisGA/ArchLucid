using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Provenance;
using ArchLucid.Retrieval.Indexing;
using ArchLucid.Retrieval.Models;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Retrieval.Tests;

[Trait("Category", "Unit")]
public sealed class RetrievalRunCompletionIndexerTests
{
    [Fact]
    public async Task IndexAuthorityRunAsync_indexes_prior_committed_manifests_for_same_scope()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid workspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Guid projectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        Guid currentRunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        Guid priorRunId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

        ManifestDocument currentManifest = new()
        {
            ManifestId = Guid.NewGuid(),
            RunId = currentRunId,
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            CreatedUtc = new DateTime(2026, 5, 25, 12, 0, 0, DateTimeKind.Utc),
            ManifestHash = "hash-current",
            RuleSetId = "rules",
            RuleSetVersion = "1",
            RuleSetHash = "hash-rules",
        };

        ManifestDocument priorManifest = new()
        {
            ManifestId = Guid.NewGuid(),
            RunId = priorRunId,
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            CreatedUtc = new DateTime(2026, 5, 24, 12, 0, 0, DateTimeKind.Utc),
            ManifestHash = "hash-prior",
            RuleSetId = "rules",
            RuleSetVersion = "1",
            RuleSetHash = "hash-rules",
            Decisions =
            [
                new ResolvedArchitectureDecision
                {
                    DecisionId = "dec-managed-identity",
                    Category = "Security",
                    Title = "Managed identity",
                    SelectedOption = "System-assigned",
                    Rationale = "prior decision about managed identity",
                },
            ],
        };

        Mock<IRetrievalDocumentBuilder> documentBuilder = new();
        documentBuilder.Setup(b => b.BuildForManifest(currentManifest)).Returns([]);
        documentBuilder.Setup(b => b.BuildForArtifacts(tenantId, workspaceId, projectId, It.IsAny<IReadOnlyList<SynthesizedArtifact>>()))
            .Returns([]);
        documentBuilder.Setup(b => b.BuildForProvenance(tenantId, workspaceId, projectId, currentRunId, It.IsAny<DecisionProvenanceGraph>()))
            .Returns([]);

        List<RetrievalDocument> indexedDocuments = [];
        Mock<IRetrievalIndexingService> indexingService = new();
        indexingService
            .Setup(s => s.IndexDocumentsAsync(It.IsAny<IReadOnlyList<RetrievalDocument>>(), It.IsAny<CancellationToken>()))
            .Callback<IReadOnlyList<RetrievalDocument>, CancellationToken>((documents, _) => indexedDocuments.AddRange(documents))
            .Returns(Task.CompletedTask);

        Mock<IGoldenManifestRepository> goldenManifestRepository = new();
        goldenManifestRepository
            .Setup(r => r.ListPriorCommittedForRetrievalAsync(
                It.Is<ScopeContext>(s =>
                    s.TenantId == tenantId
                    && s.WorkspaceId == workspaceId
                    && s.ProjectId == projectId),
                currentRunId,
                2,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([priorManifest]);

        IOptionsMonitor<PriorManifestRetrievalOptions> options =
            new MockOptionsMonitor<PriorManifestRetrievalOptions>(
                new PriorManifestRetrievalOptions { MaxPriorManifestsPerIndex = 2 });

        RetrievalRunCompletionIndexer sut = new(
            documentBuilder.Object,
            indexingService.Object,
            goldenManifestRepository.Object,
            options);

        await sut.IndexAuthorityRunAsync(
            tenantId,
            workspaceId,
            projectId,
            currentManifest,
            [],
            new DecisionProvenanceGraph(),
            null,
            CancellationToken.None);

        indexedDocuments.Should().Contain(d =>
            d.CorpusKind == CorpusKind.PriorManifest
            && d.SourceType == "PriorManifestDecision"
            && d.Content.Contains("prior decision about managed identity", StringComparison.Ordinal));
    }

    private sealed class MockOptionsMonitor<T>(T value) : IOptionsMonitor<T> where T : class
    {
        public T CurrentValue => value;

        public T Get(string? name) => value;

        public IDisposable OnChange(Action<T, string?> listener) => NullDisposable.Instance;

        private sealed class NullDisposable : IDisposable
        {
            internal static readonly NullDisposable Instance = new();

            public void Dispose()
            {
            }
        }
    }
}
