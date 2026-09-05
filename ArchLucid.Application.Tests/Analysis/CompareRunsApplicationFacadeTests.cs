using ArchLucid.Application.Analysis;
using ArchLucid.Application.Diffs;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Core.Comparison;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
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
    public void CompareAgentResults_delegates_to_agent_result_diff_service()
    {
        Mock<IAgentResultDiffService> diffService = new();
        ArchitectureRunDetail left = new();
        ArchitectureRunDetail right = new();
        AgentResultDiffResult expected = new();

        diffService
            .Setup(s => s.Compare("left", left.Results, "right", right.Results))
            .Returns(expected);

        CompareRunsApplicationFacade sut = CreateSut(agentResultDiff: diffService.Object);

        AgentResultDiffResult result = sut.CompareAgentResults("left", left, "right", right);

        result.Should().BeSameAs(expected);
    }

    private static CompareRunsApplicationFacade CreateSut(
        IAuthorityQueryService? authority = null,
        IRunDetailQueryService? runDetail = null,
        IComparisonService? comparison = null,
        IAgentResultDiffService? agentResultDiff = null)
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
            scopeProvider.Object,
            Mock.Of<IManifestHashService>());
    }
}
