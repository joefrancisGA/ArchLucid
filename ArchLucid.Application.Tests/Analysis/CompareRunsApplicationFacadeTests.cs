using ArchLucid.Application.Analysis;
using ArchLucid.Application.Diffs;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Persistence;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Comparison;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class CompareRunsApplicationFacadeTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.NewGuid(),
        WorkspaceId = Guid.NewGuid(),
        ProjectId = Guid.NewGuid(),
    };

    [Fact]
    public async Task CompareQuality_LoadScopedRunPairAsync_resolves_left_run_when_ids_differ_only_by_casing()
    {
        const string leftCanonical = "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
        const string rightCanonical = "ffffffffffffffffffffffffffffffff";

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailForRollupAsync(leftCanonical, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail { Run = new() { RunId = leftCanonical } });
        runDetail
            .Setup(s => s.GetRunDetailForRollupAsync(rightCanonical, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ArchitectureRunDetail?)null);

        CompareRunsApplicationFacade sut = CreateSut(runDetail: runDetail.Object);

        ScopedRunPairLoadResult result = await sut.LoadScopedRunPairAsync(
            leftCanonical.ToUpperInvariant(),
            rightCanonical.ToUpperInvariant(),
            CancellationToken.None);

        result.Outcome.Should().Be(ScopedRunPairLoadOutcome.RightRunNotFound);
        result.MissingRunId.Should().Be(rightCanonical);
        runDetail.Verify(s => s.GetRunDetailForRollupAsync(leftCanonical, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task LoadScopedRunPairAsync_trims_run_ids_before_run_detail_lookup()
    {
        const string leftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
        const string rightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailForRollupAsync(leftRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ArchitectureRunDetail?)null);
        runDetail
            .Setup(s => s.GetRunDetailForRollupAsync(rightRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail { Run = new() { RunId = rightRunId } });

        CompareRunsApplicationFacade sut = CreateSut(runDetail: runDetail.Object);

        await sut.LoadScopedRunPairAsync($"{leftRunId}\n", $"  {rightRunId}  ", CancellationToken.None);

        runDetail.Verify(s => s.GetRunDetailForRollupAsync(leftRunId, It.IsAny<CancellationToken>()), Times.Once);
        runDetail.Verify(s => s.GetRunDetailForRollupAsync(rightRunId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task LoadScopedRunPairAsync_returns_left_not_found_when_left_run_is_missing()
    {
        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailForRollupAsync("left", It.IsAny<CancellationToken>()))
            .ReturnsAsync((ArchitectureRunDetail?)null);

        CompareRunsApplicationFacade sut = CreateSut(runDetail: runDetail.Object);

        ScopedRunPairLoadResult result =
            await sut.LoadScopedRunPairAsync("left", "right", CancellationToken.None);

        result.Outcome.Should().Be(ScopedRunPairLoadOutcome.LeftRunNotFound);
        result.MissingRunId.Should().Be("left");
    }

    [Fact]
    public async Task CompareManifestsAsync_returns_base_manifest_not_found_when_golden_manifest_is_missing()
    {
        Guid baseRunId = Guid.NewGuid();
        Guid targetRunId = Guid.NewGuid();

        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(q => q.GetRunDetailForManifestCompareAsync(Scope, baseRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto { GoldenManifest = null });
        authority
            .Setup(q => q.GetRunDetailForManifestCompareAsync(Scope, targetRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto { GoldenManifest = new ManifestDocument() });

        CompareRunsApplicationFacade sut = CreateSut(authority: authority.Object);

        ManifestCompareLoadResult result =
            await sut.CompareManifestsAsync(baseRunId, targetRunId, CancellationToken.None);

        result.Outcome.Should().Be(ManifestCompareLoadOutcome.BaseManifestNotFound);
        result.RunId.Should().Be(baseRunId);
    }

    [Fact]
    public async Task CompareQuality_CompareAgentResultsAsync_delegates_to_agent_result_diff_service()
    {
        Mock<IAgentResultDiffService> diffService = new();
        ArchitectureRunDetail left = new()
        {
            Run = new ArchitectureRun { RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" },
            Results = [new AgentResult { RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", AgentType = AgentType.Compliance }],
        };
        ArchitectureRunDetail right = new()
        {
            Run = new ArchitectureRun { RunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" },
            Results = [new AgentResult { RunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", AgentType = AgentType.Topology }],
        };
        AgentResultDiffResult expected = new();

        Mock<IAgentResultRepository> agentResults = new();
        agentResults
            .Setup(r => r.GetRollupProjectionByRunIdAsync(
                Scope,
                "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(left.Results);
        agentResults
            .Setup(r => r.GetRollupProjectionByRunIdAsync(
                Scope,
                "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(right.Results);
        agentResults
            .Setup(r => r.GetRollupProjectionByRunIdAsync(
                Scope,
                It.Is<string>(id => id != "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
                    && id != "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        diffService
            .Setup(s => s.Compare(
                "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                left.Results,
                "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
                right.Results))
            .Returns(expected);

        CompareRunsApplicationFacade sut = CreateSut(
            agentResultDiff: diffService.Object,
            agentResultRepository: agentResults.Object);

        AgentResultDiffResult result = await sut.CompareAgentResultsAsync(
            left.Run.RunId,
            left,
            right.Run.RunId,
            right,
            cancellationToken: CancellationToken.None);

        result.Should().BeSameAs(expected);
    }

    [Fact]
    public async Task CompareQuality_CompareAgentResultsAsync_reloads_when_hydrated_rows_lack_run_anchor()
    {
        Guid rightRunId = Guid.Parse("43434343-4343-4343-4343-434343434343");
        string rightCanonical = rightRunId.ToString("N");

        Mock<IAgentResultEnrichmentRepository> enrichmentRepo = new();
        enrichmentRepo
            .Setup(r => r.GetByResultIdsAsync(It.IsAny<IReadOnlyList<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<string, AgentResultEnrichmentRecord>(StringComparer.Ordinal));
        InMemoryAgentResultRepository resultRepository = new(enrichmentRepo.Object);

        await resultRepository.CreateAsync(
            new AgentResult
            {
                ResultId = Guid.NewGuid().ToString("N"),
                RunId = rightCanonical,
                TaskId = Guid.NewGuid().ToString("N"),
                AgentType = AgentType.Topology,
                Claims = ["ok"],
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            CancellationToken.None);

        ArchitectureRunDetail left = new()
        {
            Run = new ArchitectureRun { RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" },
            Results = [new AgentResult { RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", AgentType = AgentType.Compliance }],
        };
        ArchitectureRunDetail right = new()
        {
            Run = new ArchitectureRun { RunId = rightCanonical },
            Results = [new AgentResult { AgentType = AgentType.Topology, RunId = string.Empty }],
        };

        AgentResultDiffResult expected = new();
        Mock<IAgentResultDiffService> diffService = new();
        diffService
            .Setup(s => s.Compare(
                "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                It.IsAny<IReadOnlyList<AgentResult>>(),
                rightCanonical,
                It.IsAny<IReadOnlyList<AgentResult>>()))
            .Returns(expected);

        CompareRunsApplicationFacade sut = CreateSut(
            agentResultDiff: diffService.Object,
            agentResultRepository: resultRepository);

        AgentResultDiffResult result = await sut.CompareAgentResultsAsync(
            left.Run.RunId,
            left,
            right.Run.RunId,
            right,
            cancellationToken: CancellationToken.None);

        result.Should().BeSameAs(expected);
        diffService.Verify(
            s => s.Compare(
                "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                It.IsAny<IReadOnlyList<AgentResult>>(),
                rightCanonical,
                It.Is<IReadOnlyList<AgentResult>>(results =>
                    results.Count == 1 && results[0].AgentType == AgentType.Topology)),
            Times.Once);
    }

    private static CompareRunsApplicationFacade CreateSut(
        IAuthorityQueryService? authority = null,
        IRunDetailQueryService? runDetail = null,
        IComparisonService? comparison = null,
        IAgentResultDiffService? agentResultDiff = null,
        IAgentResultRepository? agentResultRepository = null)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(p => p.GetCurrentScope()).Returns(Scope);

        return new CompareRunsApplicationFacade(
            authority ?? new Mock<IAuthorityQueryService>().Object,
            runDetail ?? new Mock<IRunDetailQueryService>().Object,
            new Mock<IRunRepository>().Object,
            new Mock<IUnifiedGoldenManifestReader>().Object,
            new Mock<IAuthorityCommitProjectionBuilder>().Object,
            comparison ?? new Mock<IComparisonService>().Object,
            agentResultDiff ?? new Mock<IAgentResultDiffService>().Object,
            agentResultRepository ?? new Mock<IAgentResultRepository>().Object,
            scopeProvider.Object,
            Mock.Of<IManifestHashService>());
    }
}
