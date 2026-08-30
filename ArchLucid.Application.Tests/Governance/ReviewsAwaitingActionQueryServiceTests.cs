using ArchLucid.Application.Diffs;
using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ReviewsAwaitingActionQueryServiceTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task ListAsync_throws_when_scope_is_null()
    {
        ReviewsAwaitingActionQueryService sut = CreateSut();

        Func<Task> act = () => sut.ListAsync(null!, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentNullException>();
    }

    [Fact]
    public async Task ListAsync_clears_source_run_id_when_parsed_source_run_is_out_of_scope()
    {
        Guid foreignSourceRunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        Guid recurrenceRunId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        string requestId = $"recurrence-{foreignSourceRunId:N}-weekly";

        RunRecord recurrenceRun = CreateRecurrenceRun(recurrenceRunId, requestId);

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.ListRecentInScopeAsync(Scope, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([recurrenceRun]);
        runs
            .Setup(r => r.GetByIdAsync(Scope, foreignSourceRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunRecord?)null);

        Mock<IArchitectureRequestRepository> requests = CreateRequestsMock(requestId, "Recurrence review");
        Mock<IAgentResultRepository> agentResults = CreateAgentResultsMock();
        Mock<IAgentResultDiffService> diffService = CreateDiffServiceMock(foreignSourceRunId, recurrenceRunId);

        ReviewsAwaitingActionQueryService sut = new(
            runs.Object,
            requests.Object,
            agentResults.Object,
            diffService.Object);

        Contracts.Governance.GovernanceReviewsAwaitingActionResponse response =
            await sut.ListAsync(Scope, CancellationToken.None);

        response.Items.Should().ContainSingle();
        response.Items[0].RunId.Should().Be(recurrenceRunId);
        response.Items[0].SourceRunId.Should().Be(Guid.Empty);
        response.Items[0].NewFindingCount.Should().Be(0);

        diffService.Verify(
            s => s.Compare(
                It.IsAny<string>(),
                It.IsAny<IReadOnlyList<AgentResult>>(),
                It.IsAny<string>(),
                It.IsAny<IReadOnlyList<AgentResult>>()),
            Times.Never);
        runs.Verify(
            r => r.GetByIdAsync(Scope, foreignSourceRunId, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ListAsync_does_not_call_get_by_id_when_source_run_id_is_unparseable()
    {
        Guid recurrenceRunId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        string requestId = "recurrence-not-a-guid-weekly";

        RunRecord recurrenceRun = CreateRecurrenceRun(recurrenceRunId, requestId);

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.ListRecentInScopeAsync(Scope, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([recurrenceRun]);

        Mock<IArchitectureRequestRepository> requests = CreateRequestsMock(requestId, "Recurrence review");
        Mock<IAgentResultDiffService> diffService = new();

        ReviewsAwaitingActionQueryService sut = new(
            runs.Object,
            requests.Object,
            Mock.Of<IAgentResultRepository>(),
            diffService.Object);

        Contracts.Governance.GovernanceReviewsAwaitingActionResponse response =
            await sut.ListAsync(Scope, CancellationToken.None);

        response.Items.Should().ContainSingle();
        response.Items[0].SourceRunId.Should().Be(Guid.Empty);
        response.Items[0].NewFindingCount.Should().Be(0);

        runs.Verify(
            r => r.GetByIdAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
        diffService.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task ListAsync_recurrence_detected_via_request_id_prefix_when_request_source_is_not_recurrence()
    {
        Guid recurrenceRunId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        string requestId = "recurrence-ffffffffffffffffffffffffffffffff-weekly";

        RunRecord recurrenceRun = CreateRecurrenceRun(recurrenceRunId, requestId, description: "Recurrence via id prefix");

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.ListRecentInScopeAsync(Scope, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([recurrenceRun]);

        Mock<IArchitectureRequestRepository> requests = CreateRequestsMock(requestId, "Recurrence review", requestSource: "manual");

        ReviewsAwaitingActionQueryService sut = new(
            runs.Object,
            requests.Object,
            Mock.Of<IAgentResultRepository>(),
            Mock.Of<IAgentResultDiffService>());

        Contracts.Governance.GovernanceReviewsAwaitingActionResponse response =
            await sut.ListAsync(Scope, CancellationToken.None);

        response.Items.Should().ContainSingle();
        response.Items[0].Name.Should().Be("Recurrence via id prefix");
    }

    [Fact]
    public async Task ListAsync_skips_candidate_when_architecture_request_is_missing()
    {
        Guid recurrenceRunId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        string requestId = "recurrence-ffffffffffffffffffffffffffffffff-weekly";

        RunRecord recurrenceRun = CreateRecurrenceRun(recurrenceRunId, requestId);

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.ListRecentInScopeAsync(Scope, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([recurrenceRun]);

        Mock<IArchitectureRequestRepository> requests = new();
        requests
            .Setup(r => r.ListByIdsAsync(It.IsAny<IReadOnlyList<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<string, ArchitectureRequest>());

        ReviewsAwaitingActionQueryService sut = new(
            runs.Object,
            requests.Object,
            Mock.Of<IAgentResultRepository>(),
            Mock.Of<IAgentResultDiffService>());

        Contracts.Governance.GovernanceReviewsAwaitingActionResponse response =
            await sut.ListAsync(Scope, CancellationToken.None);

        response.Items.Should().BeEmpty();
    }

    [Fact]
    public async Task ListAsync_returns_null_executed_utc_when_run_has_no_completed_timestamp()
    {
        Guid recurrenceRunId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        string requestId = "recurrence-ffffffffffffffffffffffffffffffff-weekly";

        RunRecord recurrenceRun = CreateRecurrenceRun(recurrenceRunId, requestId);
        recurrenceRun.CompletedUtc = null;

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.ListRecentInScopeAsync(Scope, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([recurrenceRun]);

        Mock<IArchitectureRequestRepository> requests = CreateRequestsMock(requestId, "Recurrence review");

        ReviewsAwaitingActionQueryService sut = new(
            runs.Object,
            requests.Object,
            Mock.Of<IAgentResultRepository>(),
            Mock.Of<IAgentResultDiffService>());

        Contracts.Governance.GovernanceReviewsAwaitingActionResponse response =
            await sut.ListAsync(Scope, CancellationToken.None);

        response.Items.Should().ContainSingle();
        response.Items[0].ExecutedUtc.Should().BeNull();
    }

    [Fact]
    public async Task ListAsync_in_scope_source_run_invokes_agent_result_diff_with_normalized_run_ids()
    {
        Guid sourceRunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        Guid recurrenceRunId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        string requestId = $"recurrence-{sourceRunId:N}-weekly";

        RunRecord recurrenceRun = CreateRecurrenceRun(recurrenceRunId, requestId);

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.ListRecentInScopeAsync(Scope, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([recurrenceRun]);
        runs
            .Setup(r => r.GetByIdAsync(Scope, sourceRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = sourceRunId, TenantId = Scope.TenantId });

        Mock<IArchitectureRequestRepository> requests = CreateRequestsMock(requestId, "Recurrence review");
        Mock<IAgentResultRepository> agentResults = CreateAgentResultsMock();
        Mock<IAgentResultDiffService> diffService = new();
        diffService
            .Setup(s => s.Compare(
                sourceRunId.ToString("N"),
                It.IsAny<IReadOnlyList<AgentResult>>(),
                recurrenceRunId.ToString("N"),
                It.IsAny<IReadOnlyList<AgentResult>>()))
            .Returns(new AgentResultDiffResult());

        ReviewsAwaitingActionQueryService sut = new(
            runs.Object,
            requests.Object,
            agentResults.Object,
            diffService.Object);

        await sut.ListAsync(Scope, CancellationToken.None);

        agentResults.Verify(
            r => r.GetRollupProjectionByRunIdAsync(Scope, sourceRunId.ToString("N"), It.IsAny<CancellationToken>()),
            Times.Once);
        agentResults.Verify(
            r => r.GetRollupProjectionByRunIdAsync(Scope, recurrenceRunId.ToString("N"), It.IsAny<CancellationToken>()),
            Times.Once);
        diffService.Verify(
            s => s.Compare(
                sourceRunId.ToString("N"),
                It.IsAny<IReadOnlyList<AgentResult>>(),
                recurrenceRunId.ToString("N"),
                It.IsAny<IReadOnlyList<AgentResult>>()),
            Times.Once);
    }

    [Fact]
    public async Task ListAsync_keeps_source_run_id_and_new_finding_count_when_source_run_is_in_scope()
    {
        Guid sourceRunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        Guid recurrenceRunId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        string requestId = $"recurrence-{sourceRunId:N}-weekly";

        RunRecord recurrenceRun = CreateRecurrenceRun(recurrenceRunId, requestId, description: "Weekly recurrence");

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.ListRecentInScopeAsync(Scope, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([recurrenceRun]);
        runs
            .Setup(r => r.GetByIdAsync(Scope, sourceRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = sourceRunId, TenantId = Scope.TenantId });

        Mock<IArchitectureRequestRepository> requests = CreateRequestsMock(requestId, "Recurrence review", requestSource: "recurrence");
        Mock<IAgentResultRepository> agentResults = CreateAgentResultsMock();
        Mock<IAgentResultDiffService> diffService = new();
        diffService
            .Setup(s => s.Compare(
                sourceRunId.ToString("N"),
                It.IsAny<IReadOnlyList<AgentResult>>(),
                recurrenceRunId.ToString("N"),
                It.IsAny<IReadOnlyList<AgentResult>>()))
            .Returns(new AgentResultDiffResult
            {
                AgentDeltas =
                [
                    new AgentResultDelta
                    {
                        AgentType = AgentType.Critic,
                        AddedFindings = ["finding-a", "finding-b"],
                        RemovedFindings = [],
                    },
                ],
            });

        ReviewsAwaitingActionQueryService sut = new(
            runs.Object,
            requests.Object,
            agentResults.Object,
            diffService.Object);

        Contracts.Governance.GovernanceReviewsAwaitingActionResponse response =
            await sut.ListAsync(Scope, CancellationToken.None);

        response.Items.Should().ContainSingle();
        response.Items[0].SourceRunId.Should().Be(sourceRunId);
        response.Items[0].NewFindingCount.Should().Be(2);
        response.Items[0].Name.Should().Be("Weekly recurrence");
        response.Items[0].ExecutedUtc.Should().Be(new DateTimeOffset(2026, 8, 27, 12, 0, 0, TimeSpan.Zero));
    }

    [Fact]
    public async Task ListAsync_ignores_non_recurrence_runs()
    {
        RunRecord manualRun = new()
        {
            TenantId = Scope.TenantId,
            WorkspaceId = Scope.WorkspaceId,
            ScopeProjectId = Scope.ProjectId,
            RunId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff"),
            ArchitectureRequestId = "manual-request",
            LegacyRunStatus = nameof(ArchitectureRunStatus.ReadyForCommit),
            CompletedUtc = new DateTime(2026, 8, 27, 12, 0, 0, DateTimeKind.Utc),
        };

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.ListRecentInScopeAsync(Scope, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([manualRun]);

        Mock<IArchitectureRequestRepository> requests = new();
        requests
            .Setup(r => r.ListByIdsAsync(It.IsAny<IReadOnlyList<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new Dictionary<string, ArchitectureRequest>
                {
                    ["manual-request"] = new()
                    {
                        RequestId = "manual-request",
                        Description = "Manual review",
                        SystemName = "svc",
                        RequestSource = "manual",
                    },
                });

        ReviewsAwaitingActionQueryService sut = new(
            runs.Object,
            requests.Object,
            Mock.Of<IAgentResultRepository>(),
            Mock.Of<IAgentResultDiffService>());

        Contracts.Governance.GovernanceReviewsAwaitingActionResponse response =
            await sut.ListAsync(Scope, CancellationToken.None);

        response.Items.Should().BeEmpty();
    }

    [Fact]
    public async Task ListAsync_ignores_golden_manifest_and_non_ready_runs()
    {
        RunRecord goldenRun = new()
        {
            TenantId = Scope.TenantId,
            WorkspaceId = Scope.WorkspaceId,
            ScopeProjectId = Scope.ProjectId,
            RunId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            ArchitectureRequestId = "recurrence-22222222222222222222222222222222-weekly",
            LegacyRunStatus = nameof(ArchitectureRunStatus.ReadyForCommit),
            GoldenManifestId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
        };

        RunRecord pendingRun = new()
        {
            TenantId = Scope.TenantId,
            WorkspaceId = Scope.WorkspaceId,
            ScopeProjectId = Scope.ProjectId,
            RunId = Guid.Parse("44444444-4444-4444-4444-444444444444"),
            ArchitectureRequestId = "recurrence-55555555555555555555555555555555-weekly",
            LegacyRunStatus = nameof(ArchitectureRunStatus.WaitingForResults),
        };

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.ListRecentInScopeAsync(Scope, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([goldenRun, pendingRun]);

        Mock<IArchitectureRequestRepository> requests = new();
        requests
            .Setup(r => r.ListByIdsAsync(It.IsAny<IReadOnlyList<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<string, ArchitectureRequest>());

        ReviewsAwaitingActionQueryService sut = new(
            runs.Object,
            requests.Object,
            Mock.Of<IAgentResultRepository>(),
            Mock.Of<IAgentResultDiffService>());

        Contracts.Governance.GovernanceReviewsAwaitingActionResponse response =
            await sut.ListAsync(Scope, CancellationToken.None);

        response.Items.Should().BeEmpty();
    }

    [Fact]
    public async Task ListAsync_falls_back_to_request_id_when_description_is_blank()
    {
        Guid recurrenceRunId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        string requestId = "recurrence-ffffffffffffffffffffffffffffffff-weekly";

        RunRecord recurrenceRun = CreateRecurrenceRun(recurrenceRunId, requestId, description: "   ");

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.ListRecentInScopeAsync(Scope, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([recurrenceRun]);

        Mock<IArchitectureRequestRepository> requests = CreateRequestsMock(requestId, "Recurrence review");

        ReviewsAwaitingActionQueryService sut = new(
            runs.Object,
            requests.Object,
            Mock.Of<IAgentResultRepository>(),
            Mock.Of<IAgentResultDiffService>());

        Contracts.Governance.GovernanceReviewsAwaitingActionResponse response =
            await sut.ListAsync(Scope, CancellationToken.None);

        response.Items.Should().ContainSingle();
        response.Items[0].Name.Should().Be(requestId);
    }

    private static ReviewsAwaitingActionQueryService CreateSut()
    {
        return new ReviewsAwaitingActionQueryService(
            Mock.Of<IRunRepository>(),
            Mock.Of<IArchitectureRequestRepository>(),
            Mock.Of<IAgentResultRepository>(),
            Mock.Of<IAgentResultDiffService>());
    }

    private static RunRecord CreateRecurrenceRun(Guid recurrenceRunId, string requestId, string? description = null)
    {
        return new RunRecord
        {
            TenantId = Scope.TenantId,
            WorkspaceId = Scope.WorkspaceId,
            ScopeProjectId = Scope.ProjectId,
            RunId = recurrenceRunId,
            ArchitectureRequestId = requestId,
            LegacyRunStatus = nameof(ArchitectureRunStatus.ReadyForCommit),
            CompletedUtc = new DateTime(2026, 8, 27, 12, 0, 0, DateTimeKind.Utc),
            Description = description,
        };
    }

    private static Mock<IArchitectureRequestRepository> CreateRequestsMock(
        string requestId,
        string description,
        string requestSource = "recurrence")
    {
        Mock<IArchitectureRequestRepository> requests = new();
        requests
            .Setup(r => r.ListByIdsAsync(It.IsAny<IReadOnlyList<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new Dictionary<string, ArchitectureRequest>
                {
                    [requestId] = new()
                    {
                        RequestId = requestId,
                        Description = description,
                        SystemName = "svc",
                        RequestSource = requestSource,
                    },
                });

        return requests;
    }

    private static Mock<IAgentResultRepository> CreateAgentResultsMock()
    {
        Mock<IAgentResultRepository> agentResults = new();
        agentResults
            .Setup(r => r.GetRollupProjectionByRunIdAsync(Scope, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        return agentResults;
    }

    private static Mock<IAgentResultDiffService> CreateDiffServiceMock(Guid foreignSourceRunId, Guid recurrenceRunId)
    {
        Mock<IAgentResultDiffService> diffService = new();
        diffService
            .Setup(s => s.Compare(It.IsAny<string>(), It.IsAny<IReadOnlyList<AgentResult>>(), It.IsAny<string>(), It.IsAny<IReadOnlyList<AgentResult>>()))
            .Returns(new AgentResultDiffResult { LeftRunId = foreignSourceRunId.ToString("N"), RightRunId = recurrenceRunId.ToString("N") });

        return diffService;
    }
}
