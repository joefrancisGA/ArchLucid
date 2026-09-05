using ArchLucid.Application;
using ArchLucid.Application.Runs.Enrichment;
using ArchLucid.Application.Trust;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Runs.Enrichment;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RunDetailTrustEvidenceEnrichmentSliceTests
{
    [Fact]
    public async Task EnrichAsync_swallows_sealed_hash_conflict_so_review_detail_get_does_not_409()
    {
        Guid runId = Guid.Parse("6e8c4a10-2b1f-4c9a-9d3e-10b2a4f0c501");
        RunDetailDto detail = new()
        {
            Run = new RunRecord
            {
                RunId = runId,
                GoldenManifestId = Guid.NewGuid(),
            },
        };
        ArchitectureRunDetail architectureDetail = new()
        {
            Run = new ArchitectureRun
            {
                RunId = runId.ToString("N"),
                Status = ArchitectureRunStatus.Committed,
            },
            Manifest = new GoldenManifest
            {
                RunId = runId.ToString("N"),
                SystemName = "demo",
                Metadata = new ManifestMetadata
                {
                    ManifestVersion = "contoso-baseline-v1",
                    CreatedUtc = new DateTime(2025, 3, 1, 12, 0, 0, DateTimeKind.Utc),
                    ChangeDescription = string.Empty,
                },
            },
        };

        Mock<IRunTrustEvidenceCardBuilder> builder = new();
        builder
            .Setup(b => b.BuildAsync(architectureDetail, "Real", It.IsAny<CancellationToken>()))
            .ThrowsAsync(new ConflictException(
                $"Commit recovery blocked for run '{runId:D}': sealed manifest hash does not match recomputed hash."));

        RunDetailTrustEvidenceEnrichmentSlice slice = new(builder.Object);
        RunDetailEnrichmentContext context = new()
        {
            Detail = detail,
            ArchitectureDetail = architectureDetail,
            HostAgentExecutionMode = "Real",
        };

        Func<Task> act = () => slice.EnrichAsync(context, CancellationToken.None);

        await act.Should().NotThrowAsync();
        detail.TrustEvidenceCard.Should().BeNull();
    }
}
