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
    public async Task ListAsync_clears_source_run_id_when_parsed_source_run_is_out_of_scope()
    {
        Guid foreignSourceRunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        Guid recurrenceRunId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        string requestId = $"recurrence-{foreignSourceRunId:N}-weekly";

        RunRecord recurrenceRun = new()
        {
            TenantId = Scope.TenantId,
            WorkspaceId = Scope.WorkspaceId,
            ScopeProjectId = Scope.ProjectId,
            RunId = recurrenceRunId,
            ArchitectureRequestId = requestId,
            LegacyRunStatus = nameof(ArchitectureRunStatus.ReadyForCommit),
            CompletedUtc = new DateTime(2026, 8, 27, 12, 0, 0, DateTimeKind.Utc),
        };

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.ListRecentInScopeAsync(Scope, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([recurrenceRun]);
        runs
            .Setup(r => r.GetByIdAsync(Scope, foreignSourceRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunRecord?)null);

        Mock<IArchitectureRequestRepository> requests = new();
        requests
            .Setup(r => r.ListByIdsAsync(It.IsAny<IReadOnlyList<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new Dictionary<string, ArchitectureRequest>
                {
                    [requestId] = new()
                    {
                        RequestId = requestId,
                        Description = "Recurrence review",
                        SystemName = "svc",
                        RequestSource = "recurrence",
                    },
                });

        Mock<IAgentResultRepository> agentResults = new();
        agentResults
            .Setup(r => r.GetRollupProjectionByRunIdAsync(Scope, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<IAgentResultDiffService> diffService = new();
        diffService
            .Setup(s => s.Compare(It.IsAny<string>(), It.IsAny<IReadOnlyList<AgentResult>>(), It.IsAny<string>(), It.IsAny<IReadOnlyList<AgentResult>>()))
            .Returns(new AgentResultDiffResult { LeftRunId = foreignSourceRunId.ToString("N"), RightRunId = recurrenceRunId.ToString("N") });

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
    }
}
