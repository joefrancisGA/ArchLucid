using ArchLucid.Application.Analysis;
using ArchLucid.Application.Determinism;
using ArchLucid.Application.Diagrams;
using ArchLucid.Application.Diffs;
using ArchLucid.Application.Summaries;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class ArchitectureAnalysisServiceTests
{
    [Fact]
    public async Task BuildAsync_blocks_unsealed_compare_run_when_agent_result_compare_is_requested()
    {
        Guid primaryRunId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid compareRunId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };

        Mock<IRunDetailQueryService> runDetails = new();
        runDetails
            .Setup(service => service.GetRunDetailAsync(
                primaryRunId.ToString("N"),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail
            {
                Run = new ArchitectureRun { RunId = primaryRunId.ToString("N") },
            });
        runDetails
            .Setup(service => service.GetRunDetailAsync(
                compareRunId.ToString("N"),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail
            {
                Run = new ArchitectureRun { RunId = compareRunId.ToString("N") },
            });

        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(service => service.GetRunDetailForManifestCompareAsync(
                It.IsAny<ScopeContext>(),
                primaryRunId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto
            {
                Run = new RunRecord { RunId = primaryRunId },
                GoldenManifest = new ManifestDocument
                {
                    RunId = primaryRunId,
                    ManifestHash = "sealed-primary",
                },
            });
        authority
            .Setup(service => service.GetRunDetailForManifestCompareAsync(
                It.IsAny<ScopeContext>(),
                compareRunId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto
            {
                Run = new RunRecord { RunId = compareRunId },
                GoldenManifest = null,
            });

        Mock<IManifestHashService> manifestHash = new();
        manifestHash
            .Setup(service => service.ComputeHash(It.IsAny<ManifestDocument>()))
            .Returns("sealed-primary");

        ArchitectureAnalysisService sut = new(
            runDetails.Object,
            Mock.Of<IScopeContextProvider>(provider => provider.GetCurrentScope() == scope),
            Mock.Of<IUnifiedGoldenManifestReader>(),
            Mock.Of<IAgentEvidencePackageRepository>(),
            Mock.Of<IAgentExecutionTraceRepository>(),
            Mock.Of<IAgentResultRepository>(),
            Mock.Of<IDiagramGenerator>(),
            Mock.Of<IManifestSummaryGenerator>(),
            Mock.Of<IDeterminismCheckService>(),
            Mock.Of<IManifestDiffService>(),
            Mock.Of<IAgentResultDiffService>(),
            authority.Object,
            manifestHash.Object);

        Func<Task> act = () => sut.BuildAsync(
            new ArchitectureAnalysisRequest
            {
                RunId = primaryRunId.ToString("N"),
                IncludeEvidence = false,
                IncludeExecutionTraces = false,
                IncludeManifest = false,
                IncludeDiagram = false,
                IncludeSummary = false,
                IncludeAgentResultCompare = true,
                CompareRunId = compareRunId.ToString("N"),
            });

        await act.Should().ThrowAsync<ConflictException>();
    }
}
