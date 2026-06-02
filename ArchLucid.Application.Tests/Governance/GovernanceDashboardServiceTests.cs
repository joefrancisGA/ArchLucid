using ArchLucid.Application;
using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Contracts.Architecture;

using FluentAssertions;

using Moq;

using ArchLucid.Core.Scoping;
namespace ArchLucid.Application.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class GovernanceDashboardServiceTests
{
    [SkippableFact]
    public async Task GetDashboard_ReturnsPendingAndDecisionsAndChanges()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
        GovernanceApprovalRequest pending = new() { ApprovalRequestId = "p1", Status = GovernanceApprovalStatus.Submitted };
        GovernanceApprovalRequest decision = new()
        {
            ApprovalRequestId = "d1", Status = GovernanceApprovalStatus.Approved, ReviewedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        PolicyPackChangeLogEntry change = new()
        {
            ChangeLogId = Guid.NewGuid(),
            PolicyPackId = Guid.NewGuid(),
            TenantId = tenantId,
            ChangeType = "Published",
            ChangedBy = "u1",
            ChangedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        Mock<IGovernanceApprovalRequestRepository> approvals = new();
        approvals
            .Setup(a => a.GetPendingAsync(20, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<GovernanceApprovalRequest> { pending });

        approvals
            .Setup(a => a.GetRecentDecisionsAsync(20, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<GovernanceApprovalRequest> { decision });

        Mock<IPolicyPackChangeLogRepository> changes = new();
        changes
            .Setup(c => c.GetByTenantAsync(tenantId, 20, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PolicyPackChangeLogEntry> { change });

        (Mock<IRunDetailQueryService> runQuery, Mock<IAgentExecutionTraceRepository> traces) = CreateEmptyTokenMocks();

        IGovernanceDashboardService sut = new GovernanceDashboardService(
            approvals.Object,
            changes.Object,
            runQuery.Object,
            traces.Object,
            CreateScopeProvider());

        GovernanceDashboardSummary summary = await sut.GetDashboardAsync(tenantId);

        summary.PendingApprovals.Should().ContainSingle().Which.ApprovalRequestId.Should().Be("p1");
        summary.RecentDecisions.Should().ContainSingle().Which.ApprovalRequestId.Should().Be("d1");
        summary.RecentChanges.Should().ContainSingle().Which.TenantId.Should().Be(tenantId);
        summary.PendingCount.Should().Be(1);
        summary.TotalPromptTokens.Should().Be(0);
        summary.TotalCompletionTokens.Should().Be(0);
    }

    [SkippableFact]
    public async Task GetDashboard_EmptyState_ReturnsEmptyLists()
    {
        Guid tenantId = Guid.Parse("bbbbbbbb-cccc-dddd-eeee-ffffffffffff");

        Mock<IGovernanceApprovalRequestRepository> approvals = new();
        approvals.Setup(a => a.GetPendingAsync(20, It.IsAny<CancellationToken>())).ReturnsAsync([]);
        approvals.Setup(a => a.GetRecentDecisionsAsync(20, It.IsAny<CancellationToken>())).ReturnsAsync([]);

        Mock<IPolicyPackChangeLogRepository> changes = new();
        changes.Setup(c => c.GetByTenantAsync(tenantId, 20, It.IsAny<CancellationToken>())).ReturnsAsync([]);

        (Mock<IRunDetailQueryService> runQuery, Mock<IAgentExecutionTraceRepository> traces) = CreateEmptyTokenMocks();

        IGovernanceDashboardService sut = new GovernanceDashboardService(
            approvals.Object,
            changes.Object,
            runQuery.Object,
            traces.Object,
            CreateScopeProvider());

        GovernanceDashboardSummary summary = await sut.GetDashboardAsync(tenantId);

        summary.PendingApprovals.Should().BeEmpty();
        summary.RecentDecisions.Should().BeEmpty();
        summary.RecentChanges.Should().BeEmpty();
        summary.PendingCount.Should().Be(0);
    }

    [SkippableFact]
    public async Task GetDashboard_AggregatesTokenDimensionsFromRecentRuns()
    {
        Guid tenantId = Guid.Parse("cccccccc-dddd-eeee-ffff-000011112222");
        string runId = Guid.NewGuid().ToString("N");
        DateTime createdUtc = TimeProvider.System.UtcNowDateTime();

        Mock<IGovernanceApprovalRequestRepository> approvals = new();
        approvals.Setup(a => a.GetPendingAsync(20, It.IsAny<CancellationToken>())).ReturnsAsync([]);
        approvals.Setup(a => a.GetRecentDecisionsAsync(20, It.IsAny<CancellationToken>())).ReturnsAsync([]);

        Mock<IPolicyPackChangeLogRepository> changes = new();
        changes.Setup(c => c.GetByTenantAsync(tenantId, 20, It.IsAny<CancellationToken>())).ReturnsAsync([]);

        Mock<IRunDetailQueryService> runQuery = new();
        runQuery
            .Setup(q => q.ListRunSummariesKeysetAsync(null, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((
                new List<RunSummary>
                {
                    new()
                    {
                        RunId = runId,
                        Status = nameof(ArchitectureRunStatus.Committed),
                        CreatedUtc = createdUtc,
                    },
                },
                false,
                (string?)null));

        Mock<IAgentExecutionTraceRepository> traces = new();
        traces
            .Setup(t => t.GetByRunIdAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<AgentExecutionTrace>
            {
                new() { InputTokenCount = 120, OutputTokenCount = 45 },
                new() { InputTokenCount = 80, OutputTokenCount = 55 },
            });

        IGovernanceDashboardService sut = new GovernanceDashboardService(
            approvals.Object,
            changes.Object,
            runQuery.Object,
            traces.Object,
            CreateScopeProvider());

        GovernanceDashboardSummary summary = await sut.GetDashboardAsync(tenantId);

        summary.TotalPromptTokens.Should().Be(200);
        summary.TotalCompletionTokens.Should().Be(100);
    }

    private static IScopeContextProvider CreateScopeProvider()
    {
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext());

        return scope.Object;
    }

    private static (Mock<IRunDetailQueryService> RunQuery, Mock<IAgentExecutionTraceRepository> Traces) CreateEmptyTokenMocks()
    {
        Mock<IRunDetailQueryService> runQuery = new();
        runQuery
            .Setup(q => q.ListRunSummariesKeysetAsync(null, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Array.Empty<RunSummary>(), false, (string?)null));

        Mock<IAgentExecutionTraceRepository> traces = new();

        return (runQuery, traces);
    }
}
