using System.Security.Claims;

using ArchLucid.Api.Contracts;
using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Api.Support;
using ArchLucid.Application.Audit;
using ArchLucid.Application.Common;
using ArchLucid.Application.Explanation;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Provenance;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Traceability;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.DevTesting;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Pagination;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.TestSupport.SealedManifest;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AuthorityRunInventoryShareAccessTests
{
    private const string Project = "payments";

    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    private readonly ClaimsPrincipal _principal = new(new ClaimsIdentity("Test"));
    private readonly Mock<IAuthorityQueryService> _authority = new(MockBehavior.Strict);
    private readonly Mock<IRunRepository> _runs = new(MockBehavior.Strict);
    private readonly Mock<IAgentExecutionTraceRepository> _traces = new(MockBehavior.Strict);
    private readonly Mock<IArchitectureShareAccessGate> _gate = new(MockBehavior.Strict);
    private readonly Mock<IScopeContextProvider> _scopes = new(MockBehavior.Strict);

    public AuthorityRunInventoryShareAccessTests()
    {
        _scopes.Setup(x => x.GetCurrentScope()).Returns(Scope);
    }

    [Theory]
    [InlineData("canonical")]
    [InlineData("legacy-scope")]
    [InlineData("legacy-project")]
    public async Task Inventory_pages_visible_runs_and_verifies_only_the_visible_committed_run(string route)
    {
        RunRecord hiddenCommitted = Header(0, committed: true);
        RunRecord first = Header(1, committed: true);
        RunRecord second = Header(RunPagination.MaxTake);
        List<RunRecord> rows = [hiddenCommitted, first];
        rows.AddRange(Enumerable.Range(2, RunPagination.MaxTake - 2).Select(i => Header(i)));
        rows.Add(second);
        rows.Add(Header(RunPagination.MaxTake + 1));

        SeedInventory(rows, [first.RunId, second.RunId]);
        SetupSeal(first, SealedManifestHashTestSupport.DefaultHash);
        SetupTraces(first);
        SetupTraces(second);

        CursorPagedResponse<RunSummaryResponse> firstPage = Body(await GetPageAsync(route));

        firstPage.Items.Select(x => x.RunId).Should().Equal(first.RunId);
        firstPage.HasMore.Should().BeTrue();
        firstPage.NextCursor.Should().Be(RunCursorCodec.Encode(first.CreatedUtc, first.RunId));
        firstPage.RequestedTake.Should().Be(1);

        CursorPagedResponse<RunSummaryResponse> secondPage = Body(await GetPageAsync(route, firstPage.NextCursor));

        secondPage.Items.Select(x => x.RunId).Should().Equal(second.RunId);
        secondPage.HasMore.Should().BeFalse();
        secondPage.NextCursor.Should().BeNull();
        _authority.Verify(a => a.GetRunDetailForManifestCompareAsync(Scope, first.RunId, CancellationToken.None), Times.Exactly(2));
        _authority.VerifyNoOtherCalls();
        _gate.Verify(g => g.EvaluateRunReadAsync(_principal, Scope, hiddenCommitted.RunId, CancellationToken.None),
            Times.Exactly(2));
        if (route == "legacy-project")
        {
            _runs.Verify(r => r.ListByProjectKeysetAsync(
                Scope, Project, first.CreatedUtc, first.RunId, RunPagination.MaxTake, CancellationToken.None), Times.Once);
        }
    }

    [Fact]
    public async Task Hidden_only_inventory_returns_empty_without_loading_a_manifest_or_traces()
    {
        SeedInventory([Header(0, committed: true), Header(1)], []);

        CursorPagedResponse<RunSummaryResponse> page = Body(await GetPageAsync("canonical"));

        page.Items.Should().BeEmpty();
        page.HasMore.Should().BeFalse();
        page.NextCursor.Should().BeNull();
        _authority.VerifyNoOtherCalls();
        _traces.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Visible_committed_run_with_an_invalid_seal_still_blocks_the_inventory()
    {
        RunRecord hidden = Header(0, committed: true);
        RunRecord visible = Header(1, committed: true);
        SeedInventory([hidden, visible], [visible.RunId]);
        SetupSeal(visible, "stored-hash-does-not-match");

        IActionResult result = await GetPageAsync("canonical");

        result.Should().BeAssignableTo<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status409Conflict);
        _authority.Verify(a => a.GetRunDetailForManifestCompareAsync(Scope, visible.RunId, CancellationToken.None), Times.Once);
        _authority.VerifyNoOtherCalls();
        _traces.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task A_run_removed_after_candidate_lookup_does_not_enter_the_page()
    {
        RunRecord candidate = Header(0, committed: true);
        SeedInventory([candidate], [candidate.RunId]);
        _gate.Setup(g => g.EvaluateRunReadAsync(_principal, Scope, candidate.RunId, CancellationToken.None))
            .ReturnsAsync((false, false));

        CursorPagedResponse<RunSummaryResponse> page = Body(await GetPageAsync("canonical"));

        page.Items.Should().BeEmpty();
        page.HasMore.Should().BeFalse();
        page.NextCursor.Should().BeNull();
        _authority.VerifyNoOtherCalls();
        _traces.VerifyNoOtherCalls();
    }

    private void SeedInventory(List<RunRecord> sortedRows, Guid[] visible)
    {
        RunListPage Page(DateTime? afterDate, Guid? afterId, int take)
        {
            int start = afterId is null
                ? 0
                : sortedRows.FindIndex(row => row.RunId == afterId && row.CreatedUtc == afterDate) + 1;
            if (afterId is not null)
                start.Should().BeGreaterThan(0);

            return new RunListPage(sortedRows.Skip(start).Take(take).ToList(), sortedRows.Count > start + take);
        }

        _runs.Setup(r => r.ListRecentInScopeKeysetAsync(
                Scope, It.IsAny<DateTime?>(), It.IsAny<Guid?>(), RunPagination.MaxTake, CancellationToken.None))
            .ReturnsAsync((ScopeContext _, DateTime? date, Guid? id, int take, CancellationToken _) => Page(date, id, take));
        _runs.Setup(r => r.ListByProjectKeysetAsync(
                Scope, Project, It.IsAny<DateTime?>(), It.IsAny<Guid?>(), RunPagination.MaxTake, CancellationToken.None))
            .ReturnsAsync((ScopeContext _, string _, DateTime? date, Guid? id, int take, CancellationToken _) =>
                Page(date, id, take));

        _gate.Setup(g => g.EvaluateRunReadAsync(_principal, Scope, It.IsAny<Guid>(), CancellationToken.None))
            .ReturnsAsync((ClaimsPrincipal _, ScopeContext _, Guid id, CancellationToken _) =>
                (true, visible.Contains(id)));
    }

    private void SetupSeal(RunRecord run, string storedHash) =>
        _authority.Setup(a => a.GetRunDetailForManifestCompareAsync(Scope, run.RunId, CancellationToken.None))
            .ReturnsAsync(new RunDetailDto
            {
                Run = run,
                GoldenManifest = new ManifestDocument { RunId = run.RunId, ManifestHash = storedHash },
            });

    private void SetupTraces(RunRecord run)
    {
        string id = run.RunId.ToString("N");
        _traces.Setup(t => t.GetDistinctAgentTypesWithLlmResourceFallbackByRunIdsAsync(
                Scope, It.Is<IReadOnlyList<string>>(ids => ids.Count == 1 && ids[0] == id), CancellationToken.None))
            .ReturnsAsync(new Dictionary<string, IReadOnlyList<string>>());
    }

    private async Task<IActionResult> GetPageAsync(string route, string? cursor = null)
    {
        IManifestHashService hash = SealedManifestHashTestSupport.CreateManifestHashService();
        AuthorityRunReadHandlers handlers = new(
            _authority.Object,
            Mock.Of<IAuthorityRunDetailOperatorEnricher>(),
            Mock.Of<IRunRationaleService>(),
            Mock.Of<IRunPipelineAuditTimelineService>(),
            _scopes.Object,
            Mock.Of<IProvenanceGraphAccessService>(),
            Mock.Of<IAuditService>(),
            Mock.Of<IActorContext>(),
            Mock.Of<IEffectiveAgentExecutionModeAccessor>(),
            hash,
            NullLogger<AuthorityRunReadHandlers>.Instance,
            new AuthorityRunInventoryQuery(_runs.Object, _traces.Object),
            _gate.Object);
        ControllerContext context = new() { HttpContext = new DefaultHttpContext { User = _principal } };

        if (route == "canonical")
        {
            AuthorityReadsController controller = new(handlers, Mock.Of<ITraceabilityBundleExportApplicationService>(),
                hash, _scopes.Object, _authority.Object, _gate.Object) { ControllerContext = context };
            return await controller.ListRuns(cursor, take: 1);
        }

        AuthorityQueryController legacy = new(
            _authority.Object, handlers, Mock.Of<IAuthorityRunDetailOperatorEnricher>(), Mock.Of<IRunRetrievalGroundingService>(),
            _scopes.Object, Mock.Of<IActorContext>(), Mock.Of<IRunOperatorGovernanceDispositionService>(), hash,
            Mock.Of<IConfiguration>(), Mock.Of<IEffectiveAgentExecutionModeAccessor>(), _gate.Object,
            NullLogger<AuthorityQueryController>.Instance) { ControllerContext = context };

#pragma warning disable CS0618 // Exercise both supported legacy HTTP actions.
        return route == "legacy-scope"
            ? await legacy.ListRunsInScope(cursor, take: 1)
            : await legacy.ListRunsByProject(Project, cursor, take: 1);
#pragma warning restore CS0618
    }

    private static CursorPagedResponse<RunSummaryResponse> Body(IActionResult result) =>
        result.Should().BeOfType<OkObjectResult>().Which.Value
            .Should().BeOfType<CursorPagedResponse<RunSummaryResponse>>().Which;

    private static RunRecord Header(int index, bool committed = false) =>
        new()
        {
            RunId = Guid.NewGuid(),
            ProjectId = Project,
            CreatedUtc = new DateTime(2026, 11, 24, 12, 0, 0, DateTimeKind.Utc).AddMinutes(-index),
            LegacyRunStatus = committed ? nameof(ArchitectureRunStatus.Committed) : nameof(ArchitectureRunStatus.Created),
        };
}
