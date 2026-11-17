using ArchLucid.Application.Analysis;
using ArchLucid.Application.Analysis.ReplayComparison;
using ArchLucid.Application.Diffs;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Persistence;
using ArchLucid.Core.Persistence.ApplicationPorts.Data.Repositories;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class ReplayComparisonAgentResultsDiffSliceTests
{
    [Fact]
    public async Task CompareQuality_ApplyAsync_reloads_agent_results_when_hydrated_rows_lack_run_anchor()
    {
        Guid leftRunId = Guid.Parse("31313131-3131-3131-3131-313131313131");
        Guid rightRunId = Guid.Parse("42424242-4242-4242-4242-424242424242");
        string leftCanonical = leftRunId.ToString("N");
        string rightCanonical = rightRunId.ToString("N");

        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };

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

        AgentResultDiffResult diffResult = new();
        Mock<IAgentResultDiffService> agentDiff = new();
        agentDiff
            .Setup(s => s.Compare(
                leftCanonical,
                It.IsAny<IReadOnlyList<AgentResult>>(),
                rightCanonical,
                It.IsAny<IReadOnlyList<AgentResult>>()))
            .Returns(diffResult);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(p => p.GetCurrentScope()).Returns(scope);

        ReplayComparisonAgentResultsDiffSlice slice = new(
            agentDiff.Object,
            resultRepository,
            scopeProvider.Object);

        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = leftCanonical,
            RightRunId = rightCanonical,
        };

        ReplayComparisonBuildContext context = new()
        {
            LeftRunId = leftCanonical,
            RightRunId = rightCanonical,
            LeftDetail = new ArchitectureRunDetail
            {
                Run = new ArchitectureRun { RunId = leftCanonical },
                Results = [new AgentResult { AgentType = AgentType.Compliance, RunId = leftCanonical }],
            },
            RightDetail = new ArchitectureRunDetail
            {
                Run = new ArchitectureRun { RunId = rightCanonical },
                Results = [new AgentResult { AgentType = AgentType.Topology, RunId = string.Empty }],
            },
            LeftExports = [],
            RightExports = [],
            Report = report,
        };

        await slice.ApplyAsync(context, CancellationToken.None);

        report.AgentResultDiff.Should().BeSameAs(diffResult);
        agentDiff.Verify(
            s => s.Compare(
                leftCanonical,
                It.IsAny<IReadOnlyList<AgentResult>>(),
                rightCanonical,
                It.Is<IReadOnlyList<AgentResult>>(results =>
                    results.Count == 1 && results[0].AgentType == AgentType.Topology)),
            Times.Once);
        report.Warnings.Should().NotContain("Neither run contained agent results.");
    }

    [Fact]
    public async Task CompareQuality_ApplyAsync_reloads_agent_results_when_hydrated_list_contains_null_slots()
    {
        Guid leftRunId = Guid.Parse("27272727-2727-2727-2727-272727272727");
        Guid rightRunId = Guid.Parse("28282828-2828-2828-2828-282828282828");
        string leftCanonical = leftRunId.ToString("N");
        string rightCanonical = rightRunId.ToString("N");

        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };

        Mock<IAgentResultEnrichmentRepository> enrichmentRepo = new();
        enrichmentRepo
            .Setup(r => r.GetByResultIdsAsync(It.IsAny<IReadOnlyList<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<string, AgentResultEnrichmentRecord>(StringComparer.Ordinal));
        InMemoryAgentResultRepository resultRepository = new(enrichmentRepo.Object);

        await resultRepository.CreateAsync(
            new AgentResult
            {
                ResultId = Guid.NewGuid().ToString("N"),
                RunId = leftCanonical,
                TaskId = Guid.NewGuid().ToString("N"),
                AgentType = AgentType.Compliance,
                Claims = ["left-reloaded"],
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            CancellationToken.None);
        await resultRepository.CreateAsync(
            new AgentResult
            {
                ResultId = Guid.NewGuid().ToString("N"),
                RunId = leftCanonical,
                TaskId = Guid.NewGuid().ToString("N"),
                AgentType = AgentType.Topology,
                Claims = ["left-reloaded-2"],
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            CancellationToken.None);
        await resultRepository.CreateAsync(
            new AgentResult
            {
                ResultId = Guid.NewGuid().ToString("N"),
                RunId = rightCanonical,
                TaskId = Guid.NewGuid().ToString("N"),
                AgentType = AgentType.Critic,
                Claims = ["right"],
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            CancellationToken.None);

        AgentResultDiffResult diffResult = new();
        Mock<IAgentResultDiffService> agentDiff = new();
        agentDiff
            .Setup(s => s.Compare(
                leftCanonical,
                It.IsAny<IReadOnlyList<AgentResult>>(),
                rightCanonical,
                It.IsAny<IReadOnlyList<AgentResult>>()))
            .Returns(diffResult);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(p => p.GetCurrentScope()).Returns(scope);

        ReplayComparisonAgentResultsDiffSlice slice = new(
            agentDiff.Object,
            resultRepository,
            scopeProvider.Object);

        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = leftCanonical,
            RightRunId = rightCanonical,
        };

        ReplayComparisonBuildContext context = new()
        {
            LeftRunId = leftCanonical,
            RightRunId = rightCanonical,
            LeftDetail = new ArchitectureRunDetail
            {
                Run = new ArchitectureRun { RunId = leftCanonical },
                Results =
                [
                    null!,
                    new AgentResult { AgentType = AgentType.Compliance, RunId = leftCanonical },
                ],
            },
            RightDetail = new ArchitectureRunDetail
            {
                Run = new ArchitectureRun { RunId = rightCanonical },
                Results = [new AgentResult { AgentType = AgentType.Critic, RunId = rightCanonical }],
            },
            LeftExports = [],
            RightExports = [],
            Report = report,
        };

        await slice.ApplyAsync(context, CancellationToken.None);

        report.AgentResultDiff.Should().BeSameAs(diffResult);
        agentDiff.Verify(
            s => s.Compare(
                leftCanonical,
                It.Is<IReadOnlyList<AgentResult>>(results => results.Count == 2),
                rightCanonical,
                It.Is<IReadOnlyList<AgentResult>>(results => results.Count == 1)),
            Times.Once);
    }

    [Fact]
    public async Task CompareQuality_ApplyAsync_reloads_agent_results_when_hydrated_lists_are_empty()
    {
        Guid leftRunId = Guid.Parse("35353535-3535-3535-3535-353535353535");
        Guid rightRunId = Guid.Parse("46464646-4646-4646-4646-464646464646");
        string leftCanonical = leftRunId.ToString("N");
        string rightCanonical = rightRunId.ToString("N");

        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };

        Mock<IAgentResultEnrichmentRepository> enrichmentRepo = new();
        enrichmentRepo
            .Setup(r => r.GetByResultIdsAsync(It.IsAny<IReadOnlyList<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<string, AgentResultEnrichmentRecord>(StringComparer.Ordinal));
        InMemoryAgentResultRepository resultRepository = new(enrichmentRepo.Object);

        await resultRepository.CreateAsync(
            new AgentResult
            {
                ResultId = Guid.NewGuid().ToString("N"),
                RunId = leftCanonical,
                TaskId = Guid.NewGuid().ToString("N"),
                AgentType = AgentType.Compliance,
                Claims = ["ok"],
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            CancellationToken.None);
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

        AgentResultDiffResult diffResult = new();
        Mock<IAgentResultDiffService> agentDiff = new();
        agentDiff
            .Setup(s => s.Compare(
                leftCanonical,
                It.IsAny<IReadOnlyList<AgentResult>>(),
                rightCanonical,
                It.IsAny<IReadOnlyList<AgentResult>>()))
            .Returns(diffResult);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(p => p.GetCurrentScope()).Returns(scope);

        ReplayComparisonAgentResultsDiffSlice slice = new(
            agentDiff.Object,
            resultRepository,
            scopeProvider.Object);

        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = leftCanonical,
            RightRunId = rightCanonical,
        };

        ReplayComparisonBuildContext context = new()
        {
            LeftRunId = leftCanonical,
            RightRunId = rightCanonical,
            LeftDetail = new ArchitectureRunDetail
            {
                Run = new ArchitectureRun { RunId = leftCanonical },
                Results = [],
            },
            RightDetail = new ArchitectureRunDetail
            {
                Run = new ArchitectureRun { RunId = rightCanonical },
                Results = [],
            },
            LeftExports = [],
            RightExports = [],
            Report = report,
        };

        await slice.ApplyAsync(context, CancellationToken.None);

        report.AgentResultDiff.Should().BeSameAs(diffResult);
        report.Warnings.Should().NotContain("Neither run contained agent results.");
    }
}
