using ArchLucid.Application.Analysis;
using ArchLucid.Application.Determinism;
using ArchLucid.Application.Diagrams;
using ArchLucid.Application.Diffs;
using ArchLucid.Application.Summaries;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
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

    [Fact]
    public async Task BuildAsync_nulls_preloaded_manifest_when_manifest_run_id_does_not_match_request_run()
    {
        Guid primaryRunId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid foreignRunId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };

        ArchitectureRunDetail preloadedDetail = new()
        {
            Run = new ArchitectureRun
            {
                RunId = primaryRunId.ToString("N"),
                CurrentManifestVersion = "v1-primary",
            },
            Manifest = new GoldenManifest
            {
                RunId = foreignRunId.ToString("N"),
                SystemName = "foreign",
                Metadata = new ManifestMetadata { ManifestVersion = "v1-foreign" },
            },
        };

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

        Mock<IManifestHashService> manifestHash = new();
        manifestHash
            .Setup(service => service.ComputeHash(It.IsAny<ManifestDocument>()))
            .Returns("sealed-primary");

        Mock<IUnifiedGoldenManifestReader> manifestReader = new();
        manifestReader
            .Setup(reader => reader.GetByVersionAsync("v1-primary", It.IsAny<CancellationToken>()))
            .ReturnsAsync((GoldenManifest?)null);

        ArchitectureAnalysisService sut = new(
            Mock.Of<IRunDetailQueryService>(),
            Mock.Of<IScopeContextProvider>(provider => provider.GetCurrentScope() == scope),
            manifestReader.Object,
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

        ArchitectureAnalysisReport report = await sut.BuildAsync(
            new ArchitectureAnalysisRequest
            {
                RunId = primaryRunId.ToString("N"),
                PreloadedRunDetail = preloadedDetail,
                IncludeManifest = true,
                IncludeEvidence = false,
                IncludeExecutionTraces = false,
                IncludeDiagram = false,
                IncludeSummary = false,
            });

        report.Manifest.Should().BeNull();
        report.Warnings.Should().Contain("Manifest 'v1-primary' was not found.");
    }

    [Fact]
    public async Task BuildAsync_skips_manifest_diff_when_compare_manifest_run_id_mismatches_primary()
    {
        Guid primaryRunId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid foreignRunId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };

        GoldenManifest primaryManifest = new()
        {
            RunId = primaryRunId.ToString("N"),
            SystemName = "primary",
            Metadata = new ManifestMetadata { ManifestVersion = "v1-primary" },
        };

        ArchitectureRunDetail preloadedDetail = new()
        {
            Run = new ArchitectureRun
            {
                RunId = primaryRunId.ToString("N"),
                CurrentManifestVersion = "v1-primary",
            },
            Manifest = primaryManifest,
        };

        Mock<IUnifiedGoldenManifestReader> manifestReader = new();
        manifestReader
            .Setup(reader => reader.GetByVersionAsync("v1-foreign", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GoldenManifest
            {
                RunId = foreignRunId.ToString("N"),
                SystemName = "foreign",
                Metadata = new ManifestMetadata { ManifestVersion = "v1-foreign" },
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
                    ManifestHash = "ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789",
                },
            });

        Mock<IManifestHashService> manifestHash = new();
        manifestHash
            .Setup(service => service.ComputeHash(It.IsAny<ManifestDocument>()))
            .Returns("ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789");

        Mock<IManifestDiffService> manifestDiff = new();

        ArchitectureAnalysisService sut = new(
            Mock.Of<IRunDetailQueryService>(),
            Mock.Of<IScopeContextProvider>(provider => provider.GetCurrentScope() == scope),
            manifestReader.Object,
            Mock.Of<IAgentEvidencePackageRepository>(),
            Mock.Of<IAgentExecutionTraceRepository>(),
            Mock.Of<IAgentResultRepository>(),
            Mock.Of<IDiagramGenerator>(),
            Mock.Of<IManifestSummaryGenerator>(),
            Mock.Of<IDeterminismCheckService>(),
            manifestDiff.Object,
            Mock.Of<IAgentResultDiffService>(),
            authority.Object,
            manifestHash.Object);

        ArchitectureAnalysisReport report = await sut.BuildAsync(
            new ArchitectureAnalysisRequest
            {
                RunId = primaryRunId.ToString("N"),
                PreloadedRunDetail = preloadedDetail,
                IncludeManifest = true,
                IncludeManifestCompare = true,
                CompareManifestVersion = "v1-foreign",
                IncludeEvidence = false,
                IncludeExecutionTraces = false,
                IncludeDiagram = false,
                IncludeSummary = false,
            });

        report.ManifestDiff.Should().BeNull();
        report.Warnings.Should().Contain(
            $"Compare manifest 'v1-foreign' does not belong to run '{primaryRunId:N}'.");
        manifestDiff.Verify(
            service => service.Compare(It.IsAny<GoldenManifest>(), It.IsAny<GoldenManifest>()),
            Times.Never);
    }

    [Fact]
    public async Task BuildAsync_loads_primary_agent_results_when_preloaded_detail_omits_results_for_agent_compare()
    {
        Guid primaryRunId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid compareRunId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };

        List<AgentResult> persistedPrimaryResults =
        [
            new AgentResult { AgentType = AgentType.Compliance, RunId = primaryRunId.ToString("N") },
        ];

        ArchitectureRunDetail preloadedDetail = new()
        {
            Run = new ArchitectureRun { RunId = primaryRunId.ToString("N") },
            Results = [],
        };

        Mock<IRunDetailQueryService> runDetails = new();
        runDetails
            .Setup(service => service.GetRunDetailAsync(
                compareRunId.ToString("N"),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail
            {
                Run = new ArchitectureRun { RunId = compareRunId.ToString("N") },
                Results = [],
            });

        Mock<IAgentResultRepository> resultRepository = new();
        resultRepository
            .Setup(repository => repository.GetByRunIdAsync(
                scope,
                primaryRunId.ToString("N"),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(persistedPrimaryResults);

        const string sealedHash = "ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789";

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
                    ManifestHash = sealedHash,
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
                GoldenManifest = new ManifestDocument
                {
                    RunId = compareRunId,
                    ManifestHash = sealedHash,
                },
            });

        Mock<IManifestHashService> manifestHash = new();
        manifestHash
            .Setup(service => service.ComputeHash(It.IsAny<ManifestDocument>()))
            .Returns(sealedHash);

        AgentResultDiffResult diffResult = new();
        Mock<IAgentResultDiffService> agentResultDiff = new();
        agentResultDiff
            .Setup(service => service.Compare(
                primaryRunId.ToString("N"),
                persistedPrimaryResults,
                compareRunId.ToString("N"),
                It.IsAny<IReadOnlyList<AgentResult>>()))
            .Returns(diffResult);

        ArchitectureAnalysisService sut = new(
            runDetails.Object,
            Mock.Of<IScopeContextProvider>(provider => provider.GetCurrentScope() == scope),
            Mock.Of<IUnifiedGoldenManifestReader>(),
            Mock.Of<IAgentEvidencePackageRepository>(),
            Mock.Of<IAgentExecutionTraceRepository>(),
            resultRepository.Object,
            Mock.Of<IDiagramGenerator>(),
            Mock.Of<IManifestSummaryGenerator>(),
            Mock.Of<IDeterminismCheckService>(),
            Mock.Of<IManifestDiffService>(),
            agentResultDiff.Object,
            authority.Object,
            manifestHash.Object);

        ArchitectureAnalysisReport report = await sut.BuildAsync(
            new ArchitectureAnalysisRequest
            {
                RunId = primaryRunId.ToString("N"),
                PreloadedRunDetail = preloadedDetail,
                IncludeEvidence = false,
                IncludeExecutionTraces = false,
                IncludeManifest = false,
                IncludeDiagram = false,
                IncludeSummary = false,
                IncludeAgentResultCompare = true,
                CompareRunId = compareRunId.ToString("N"),
            });

        report.AgentResultDiff.Should().BeSameAs(diffResult);
        resultRepository.Verify(
            repository => repository.GetByRunIdAsync(scope, primaryRunId.ToString("N"), It.IsAny<CancellationToken>()),
            Times.Once);
        agentResultDiff.Verify(
            service => service.Compare(
                primaryRunId.ToString("N"),
                persistedPrimaryResults,
                compareRunId.ToString("N"),
                It.IsAny<IReadOnlyList<AgentResult>>()),
            Times.Once);
    }
}
