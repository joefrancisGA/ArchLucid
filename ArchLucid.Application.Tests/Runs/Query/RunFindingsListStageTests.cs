using ArchLucid.Application.Findings;
using ArchLucid.Application.Integrations.Itsm;
using ArchLucid.Application.Integrations.Itsm.Outbound;
using ArchLucid.Application.Runs.Query;
using ArchLucid.Application.Runs.Query.Stages;
using ArchLucid.Core.Persistence.ApplicationPorts.Findings;
using ArchLucid.Core.Scoping;
using ArchLucid.Contracts.Findings;
using ArchLucid.Persistence.Models;
using ArchLucid.Application.Explanation;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Runs.Query;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RunFindingsListStageTests
{
    [Fact]
    public async Task ListRunFindingsAsync_returns_not_found_for_whitespace_run_id_without_querying_repository()
    {
        Mock<IRunRepository> runs = new();
        RunFindingsListStage sut = CreateStage(runs);

        RunFindingsListQueryResult result = await sut.ListRunFindingsAsync(
            "   ",
            orderBy: null,
            take: null,
            cursorSortOrder: null,
            cursorPriorityRank: null,
            cursorFindingRecordId: null,
            CancellationToken.None);

        result.Outcome.Should().Be(RunFindingsQueryOutcome.NotFound);
        result.ProblemDetail.Should().Contain("Run '   ' was not found.");
        runs.Verify(
            r => r.GetByIdAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task GetFindingInspectForRunAsync_returns_not_found_for_whitespace_run_id_without_querying_repository()
    {
        Mock<IRunRepository> runs = new();
        RunFindingsInspectStage sut = CreateInspectStage(runs);

        FindingInspectQueryResult result = await sut.GetFindingInspectForRunAsync(
            "   ",
            "finding-1",
            includeTypedPayload: true,
            CancellationToken.None);

        result.Outcome.Should().Be(RunFindingsQueryOutcome.NotFound);
        result.ProblemDetail.Should().Contain("Run '   ' was not found.");
        runs.Verify(
            r => r.GetByIdAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Run_specific_inspect_binds_requested_run_before_payload_read(bool includeTypedPayload)
    {
        Guid runId = Guid.NewGuid();
        ScopeContext scope = new() { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() };
        Mock<IScopeContextProvider> scopes = new();
        scopes.Setup(p => p.GetCurrentScope()).Returns(scope);
        Mock<IRunRepository> runs = new(MockBehavior.Strict);
        runs.Setup(r => r.GetByIdAsync(scope, runId, CancellationToken.None))
            .ReturnsAsync(new RunRecord { RunId = runId, GoldenManifestId = Guid.NewGuid(), LegacyRunStatus = "Committed" });
        Mock<IFindingInspectReadRepository> inspect = new(MockBehavior.Strict);
        inspect.Setup(r => r.GetInspectAsync(scope, "finding-1", CancellationToken.None,
            It.Is<FindingInspectReadOptions>(o => o.ExpectedRunId == runId &&
                o.IncludeTypedPayload == includeTypedPayload)))
            .ReturnsAsync(new FindingInspectResponse { RunId = Guid.NewGuid(), FindingId = "finding-1" });
        RunFindingsInspectStage sut = new(runs.Object, inspect.Object,
            new Mock<IFindingTrustLabelMapper>(MockBehavior.Strict).Object,
            new Mock<IReasoningSummaryBuilder>(MockBehavior.Strict).Object,
            scopes.Object, new Mock<IAuthorityQueryService>(MockBehavior.Strict).Object);

        FindingInspectQueryResult result = await sut.GetFindingInspectForRunAsync(
            runId.ToString("D"), "finding-1", includeTypedPayload, CancellationToken.None);

        result.Outcome.Should().Be(RunFindingsQueryOutcome.NotFound);
        inspect.Verify(r => r.GetInspectAsync(scope, "finding-1", CancellationToken.None,
            It.Is<FindingInspectReadOptions>(o => o.ExpectedRunId == runId &&
                o.IncludeTypedPayload == includeTypedPayload)), Times.Once);
    }

    private static RunFindingsListStage CreateStage(Mock<IRunRepository> runs)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(p => p.GetCurrentScope()).Returns(new ScopeContext());

        return new RunFindingsListStage(
            runs.Object,
            Mock.Of<IFindingsSnapshotRepository>(),
            new RunFindingExternalTrackingEnrichmentService(
                Mock.Of<IRunFindingExternalTrackingReadRepository>(),
                new ItsmExternalTicketUrlBuilder(Mock.Of<IExternalTicketConnectorRegistry>())),
            scopeProvider.Object);
    }

    private static RunFindingsInspectStage CreateInspectStage(Mock<IRunRepository> runs)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(p => p.GetCurrentScope()).Returns(new ScopeContext());

        return new RunFindingsInspectStage(
            runs.Object,
            Mock.Of<IFindingInspectReadRepository>(),
            Mock.Of<IFindingTrustLabelMapper>(),
            Mock.Of<IReasoningSummaryBuilder>(),
            scopeProvider.Object,
            Mock.Of<IAuthorityQueryService>());
    }
}
