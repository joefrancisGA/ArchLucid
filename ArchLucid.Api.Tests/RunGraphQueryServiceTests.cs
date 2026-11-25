using System.Security.Claims;

using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Api.Models;
using ArchLucid.Api.Services.Authority;
using ArchLucid.Api.Support;
using ArchLucid.Application;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Runs.Query;
using ArchLucid.Application.Trust;
using ArchLucid.Application.Traceability;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.DevTesting;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Persistence.ApplicationPorts.Agents;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RunGraphQueryServiceTests
{
    [Fact]
    public async Task GetRunRoiEstimateAsync_returns_not_found_for_whitespace_run_id_like_GetRunDetail()
    {
        Mock<IRunDetailQueryService> detail = new();
        RunGraphQueryService sut = CreateService(detail.Object);

        RunRoiEstimateQueryResult result = await sut.GetRunRoiEstimateAsync("   ", CancellationToken.None);

        result.Outcome.Should().Be(RunGraphQueryOutcome.NotFound);
        result.ProblemDetail.Should().ContainEquivalentOf("not found");
        detail.Verify(
            d => d.GetRunDetailForOperatorEnrichAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task GetRunDetailAsync_returns_not_found_for_whitespace_run_id_without_throwing()
    {
        Mock<IRunDetailQueryService> detail = new();
        RunGraphQueryService sut = CreateService(detail.Object);

        RunGraphDetailQueryResult result = await sut.GetRunDetailAsync("   ", CancellationToken.None);

        result.Outcome.Should().Be(RunGraphQueryOutcome.NotFound);
        detail.Verify(
            d => d.GetRunDetailForOperatorEnrichAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task GetRunStageTimelineAsync_returns_not_found_for_whitespace_run_id_like_GetRunDetail()
    {
        Mock<IRunRepository> runs = new();
        RunGraphQueryService sut = CreateService(Mock.Of<IRunDetailQueryService>(), runs.Object);

        RunStageTimelineQueryResult result = await sut.GetRunStageTimelineAsync("   ", CancellationToken.None);

        result.Outcome.Should().Be(RunGraphQueryOutcome.NotFound);
        result.ProblemDetail.Should().ContainEquivalentOf("not found");
        runs.Verify(
            r => r.GetByIdAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task CompareQuality_GetRunDetailAsync_includes_llm_cost_when_traces_use_legacy_run_id_key()
    {
        Guid runGuid = Guid.Parse("89898989-8989-8989-8989-898989898989");
        string routeRunId = runGuid.ToString("D").ToUpperInvariant();
        string legacyUpper = runGuid.ToString("N").ToUpperInvariant();
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };

        RunRecord runHeader = new()
        {
            RunId = runGuid,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            ProjectId = "default",
            RowVersion = [1, 2, 3, 4, 5, 6, 7, 8],
        };

        ArchitectureRunDetail architectureDetail = new()
        {
            Run = new ArchitectureRun { RunId = runGuid.ToString("N") },
            Tasks = [],
            Results = [],
        };

        Mock<IRunDetailQueryService> detail = new();
        detail
            .Setup(d => d.GetRunDetailForOperatorEnrichAsync(routeRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(architectureDetail);

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(scope, runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(runHeader);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(p => p.GetCurrentScope()).Returns(scope);

        InMemoryAgentExecutionTraceRepository traceRepository = new();
        await traceRepository.CreateAsync(
            new AgentExecutionTrace
            {
                TraceId = "trace-legacy-run-graph",
                RunId = legacyUpper,
                ModelDeploymentName = "gpt-4o",
                InputTokenCount = 120,
                OutputTokenCount = 30,
            },
            CancellationToken.None);

        Mock<ILlmCostEstimator> estimator = new();
        estimator
            .Setup(e => e.EstimateUsd(120, 30, 0, "gpt-4o"))
            .Returns(0.55m);

        Mock<IEffectiveAgentExecutionModeAccessor> executionMode = new();
        executionMode.Setup(a => a.GetEffectiveMode()).Returns("Real");

        RunGraphQueryService sut = new(
            detail.Object,
            Mock.Of<IRunRoiEstimator>(),
            runs.Object,
            Mock.Of<IRunStageOutcomesRepository>(),
            scopeProvider.Object,
            Mock.Of<IRunTrustEvidenceCardBuilder>(),
            estimator.Object,
            Mock.Of<IAuthorityQueryService>(),
            executionMode.Object,
            traceRepository,
            Mock.Of<IDbConnectionFactory>(),
            new AuthorityRunInventoryQuery(runs.Object, traceRepository),
            Mock.Of<IArchitectureShareAccessGate>());

        RunGraphDetailQueryResult result = await sut.GetRunDetailAsync(routeRunId, CancellationToken.None);

        result.Outcome.Should().Be(RunGraphQueryOutcome.Success);
        result.Response!.AgentExecutionLlmCostEstimate.Should().NotBeNull();
        result.Response.AgentExecutionLlmCostEstimate!.EstimatedCostUsd.Should().Be(0.55m);
        result.Response.AgentExecutionLlmCostEstimate.TokenCounts.Prompt.Should().Be(120);
    }

    [Fact]
    public async Task GetInteractiveGraphSnapshotAsync_returns_not_found_for_whitespace_run_id_like_GetRunDetail()
    {
        Mock<IAuthorityQueryService> authorityQuery = new();
        RunGraphQueryService sut = CreateService(Mock.Of<IRunDetailQueryService>(), Mock.Of<IRunRepository>(), authorityQuery.Object);

        RunInteractiveGraphQueryResult result =
            await sut.GetInteractiveGraphSnapshotAsync("   ", CancellationToken.None);

        result.Outcome.Should().Be(RunGraphQueryOutcome.NotFound);
        result.ProblemDetail.Should().ContainEquivalentOf("not found");
        authorityQuery.Verify(
            q => q.GetRunDetailAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Theory]
    [InlineData(false, false)]
    [InlineData(false, true)]
    [InlineData(true, false)]
    [InlineData(true, true)]
    public async Task Inventory_revalidates_continuation_when_only_lookahead_sharing_changes(bool useLegacyRoute, bool useKeyset)
    {
        RunRecord anchor = InventoryRow(0);
        RunRecord first = InventoryRow(1);
        RunRecord lookahead = InventoryRow(2);
        RunRecord hidden = InventoryRow(3);
        HashSet<Guid> visible = [first.RunId];
        RunQueryController controller = CreateInventoryController([anchor, first, lookahead, hidden], visible);
        string? cursor = useKeyset ? RunCursorCodec.Encode(anchor.CreatedUtc, anchor.RunId) : null;

        Task<IActionResult> ReadAsync() => ReadInventoryAsync(controller, useLegacyRoute, cursor, offset: 0);

        CursorPagedResponse<RunListItemResponse> initial = ReadPage(await ReadAsync());
        initial.Items.Select(row => row.RunId).Should().Equal(first.RunId.ToString("N"));
        initial.HasMore.Should().BeFalse();
        initial.NextCursor.Should().BeNull();
        string initialEtag = controller.Response.Headers.ETag.ToString();

        controller.Request.Headers.IfNoneMatch = initialEtag;
        (await ReadAsync()).Should().BeOfType<StatusCodeResult>().Which.StatusCode
            .Should().Be(StatusCodes.Status304NotModified);

        visible.Add(lookahead.RunId);
        CursorPagedResponse<RunListItemResponse> granted = ReadPage(await ReadAsync());
        granted.Items.Select(row => row.RunId).Should().Equal(first.RunId.ToString("N"));
        granted.HasMore.Should().BeTrue();
        granted.NextCursor.Should().Be(useKeyset ? RunCursorCodec.Encode(first.CreatedUtc, first.RunId) : null);
        string grantedEtag = controller.Response.Headers.ETag.ToString();
        grantedEtag.Should().NotBe(initialEtag);

        visible.Remove(lookahead.RunId);
        controller.Request.Headers.IfNoneMatch = grantedEtag;
        CursorPagedResponse<RunListItemResponse> revoked = ReadPage(await ReadAsync());
        revoked.Items.Select(row => row.RunId).Should().Equal(first.RunId.ToString("N"));
        revoked.HasMore.Should().BeFalse();
        revoked.NextCursor.Should().BeNull();
        controller.Response.Headers.ETag.ToString().Should().Be(initialEtag);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Offset_skips_only_visible_rows_across_raw_page_boundaries(bool useLegacyRoute)
    {
        RunRecord first = InventoryRow(1);
        RunRecord second = InventoryRow(RunPagination.MaxTake);
        List<RunRecord> rows = [InventoryRow(0), first];
        rows.AddRange(Enumerable.Range(2, RunPagination.MaxTake - 2).Select(InventoryRow));
        rows.Add(second);
        rows.Add(InventoryRow(RunPagination.MaxTake + 1));
        RunQueryController controller = CreateInventoryController(rows, [first.RunId, second.RunId]);

        CursorPagedResponse<RunListItemResponse> result =
            ReadPage(await ReadInventoryAsync(controller, useLegacyRoute, cursor: null, offset: 1));

        result.Items.Select(row => row.RunId).Should().Equal(second.RunId.ToString("N"));
        result.HasMore.Should().BeFalse();
        result.NextCursor.Should().BeNull();
        result.RequestedTake.Should().Be(1);
    }

    private static RunQueryController CreateInventoryController(List<RunRecord> rows, HashSet<Guid> visible)
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };
        ClaimsPrincipal principal = new(new ClaimsIdentity("Test"));
        Mock<IScopeContextProvider> scopes = new(MockBehavior.Strict);
        scopes.Setup(s => s.GetCurrentScope()).Returns(scope);
        Mock<IArchitectureShareAccessGate> gate = new(MockBehavior.Strict);
        gate.Setup(g => g.EvaluateRunReadAsync(principal, scope, It.IsAny<Guid>(), CancellationToken.None))
            .ReturnsAsync((ClaimsPrincipal _, ScopeContext _, Guid runId, CancellationToken _) => (true, visible.Contains(runId)));

        Mock<IRunRepository> runs = new(MockBehavior.Strict);
        runs.Setup(r => r.ListRecentInScopeKeysetAsync(
                scope, It.IsAny<DateTime?>(), It.IsAny<Guid?>(), RunPagination.MaxTake, CancellationToken.None))
            .ReturnsAsync((ScopeContext _, DateTime? created, Guid? id, int take, CancellationToken _) =>
            {
                int start = id is null ? 0 : rows.FindIndex(row => row.RunId == id && row.CreatedUtc == created) + 1;
                if (id is not null)
                    start.Should().BeGreaterThan(0);

                return new RunListPage(rows.Skip(start).Take(take).ToList(), rows.Count > start + take);
            });

        RunGraphQueryService graph = CreateService(
            Mock.Of<IRunDetailQueryService>(MockBehavior.Strict), runs.Object, Mock.Of<IAuthorityQueryService>(),
            scopes.Object, gate.Object);
        return new RunQueryController(
            graph,
            Mock.Of<IRunFindingsQueryService>(),
            Mock.Of<IRunProvenanceQueryService>(),
            Mock.Of<ITraceabilityBundleExportApplicationService>(),
            Mock.Of<IAuthorityQueryService>(),
            scopes.Object,
            Mock.Of<IManifestHashService>(),
            gate.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = principal } },
        };
    }

    private static Task<IActionResult> ReadInventoryAsync(
        RunQueryController controller, bool useLegacyRoute, string? cursor, int offset)
    {
#pragma warning disable CS0618 // Exercise the retained alias through its controller action.
        return useLegacyRoute
            ? controller.ListRunsLegacyAlias(cursor, limit: 1, offset: offset, take: 1)
            : controller.ListRuns(cursor, limit: 1, offset: offset, take: 1);
#pragma warning restore CS0618
    }

    private static CursorPagedResponse<RunListItemResponse> ReadPage(IActionResult action) =>
        action.Should().BeOfType<OkObjectResult>().Which.Value
            .Should().BeOfType<CursorPagedResponse<RunListItemResponse>>().Which;

    private static RunRecord InventoryRow(int index) => new()
    {
        RunId = Guid.NewGuid(),
        CreatedUtc = new DateTime(2026, 11, 24, 12, 0, 0, DateTimeKind.Utc).AddMinutes(-index),
        RowVersion = [1, 2, 3],
    };

    private static RunGraphQueryService CreateService(IRunDetailQueryService runDetailQueryService) =>
        CreateService(runDetailQueryService, Mock.Of<IRunRepository>());

    private static RunGraphQueryService CreateService(
        IRunDetailQueryService runDetailQueryService,
        IRunRepository authorityRunRepository) =>
        CreateService(runDetailQueryService, authorityRunRepository, Mock.Of<IAuthorityQueryService>());

    private static RunGraphQueryService CreateService(
        IRunDetailQueryService runDetailQueryService,
        IRunRepository authorityRunRepository,
        IAuthorityQueryService authorityQueryService,
        IScopeContextProvider? scopes = null,
        IArchitectureShareAccessGate? gate = null) =>
        new(
            runDetailQueryService,
            Mock.Of<IRunRoiEstimator>(),
            authorityRunRepository,
            Mock.Of<IRunStageOutcomesRepository>(),
            scopes ?? Mock.Of<IScopeContextProvider>(),
            Mock.Of<IRunTrustEvidenceCardBuilder>(),
            Mock.Of<ILlmCostEstimator>(),
            authorityQueryService,
            Mock.Of<IEffectiveAgentExecutionModeAccessor>(),
            Mock.Of<IAgentExecutionTraceRepository>(),
            Mock.Of<IDbConnectionFactory>(),
            new AuthorityRunInventoryQuery(authorityRunRepository, Mock.Of<IAgentExecutionTraceRepository>()),
            gate ?? Mock.Of<IArchitectureShareAccessGate>());
}
