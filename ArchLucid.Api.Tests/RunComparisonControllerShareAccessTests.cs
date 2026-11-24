using System.Security.Claims;

using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Api.Models;
using ArchLucid.Api.Support;
using ArchLucid.Api.Validators;
using ArchLucid.Application.Analysis;
using ArchLucid.Application.Diffs;
using ArchLucid.Application.Runs;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RunComparisonControllerShareAccessTests
{
    private static readonly Guid Left = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid Right = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
    };

    [Theory]
    [InlineData("agents", false)]
    [InlineData("agents", true)]
    [InlineData("agents-summary", false)]
    [InlineData("agents-summary", true)]
    [InlineData("replay", false)]
    [InlineData("replay", true)]
    [InlineData("replay-summary", false)]
    [InlineData("replay-summary", true)]
    [InlineData("markdown", false)]
    [InlineData("markdown", true)]
    [InlineData("markdown-file", false)]
    [InlineData("markdown-file", true)]
    [InlineData("docx", false)]
    [InlineData("docx", true)]
    public async Task Denied_share_stops_each_route_before_any_payload_or_side_effect(
        string route, bool denyRight)
    {
        using CancellationTokenSource cancellation = new();
        CancellationToken ct = cancellation.Token;
        Mock<IArchitectureShareAccessGate> gate = new(MockBehavior.Strict);
        NotFoundResult denial = new();
        gate.Setup(g => g.EnsureRunReadAllowedAsync(
                It.IsAny<ControllerBase>(), It.IsAny<ClaimsPrincipal>(), Scope, Left, ct))
            .ReturnsAsync(denyRight ? (IActionResult?)null : denial);
        if (denyRight)
        {
            gate.Setup(g => g.EnsureRunReadAllowedAsync(
                    It.IsAny<ControllerBase>(), It.IsAny<ClaimsPrincipal>(), Scope, Right, ct))
                .ReturnsAsync((IActionResult?)denial);
        }

        RunComparisonController controller = CreateController(gate.Object);
        RunPairQuery query = new() { LeftRunId = Left.ToString("N"), RightRunId = Right.ToString("D") };
        IActionResult result = await InvokeAsync(controller, route, query, ct);

        result.Should().BeSameAs(denial);
        gate.Verify(g => g.EnsureRunReadAllowedAsync(controller, controller.User, Scope, Left, ct), Times.Once);
        if (denyRight)
            gate.Verify(g => g.EnsureRunReadAllowedAsync(controller, controller.User, Scope, Right, ct), Times.Once);
        gate.VerifyNoOtherCalls();
    }

    [Theory]
    [InlineData("agents", false, "invalid")]
    [InlineData("agents", true, "00000000-0000-0000-0000-000000000000")]
    [InlineData("replay", false, "00000000-0000-0000-0000-000000000000")]
    [InlineData("replay", true, "invalid")]
    public async Task Unresolvable_run_ids_fail_closed_before_share_or_payload(
        string route, bool invalidRight, string invalidId)
    {
        Mock<IArchitectureShareAccessGate> gate = new(MockBehavior.Strict);
        RunComparisonController controller = CreateController(gate.Object);
        RunPairQuery query = new()
        {
            LeftRunId = invalidRight ? Left.ToString("N") : invalidId,
            RightRunId = invalidRight ? invalidId : Right.ToString("D"),
        };

        IActionResult result = await InvokeAsync(controller, route, query, CancellationToken.None);

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        gate.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Authorized_agent_pair_reaches_existing_facade_only_after_both_share_checks()
    {
        Mock<IArchitectureShareAccessGate> gate = new(MockBehavior.Strict);
        Mock<IAuthorityQueryService> authority = new(MockBehavior.Strict);
        Mock<ICompareRunsApplicationFacade> facade = new(MockBehavior.Strict);
        MockSequence sequence = new();
        CancellationToken ct = CancellationToken.None;
        string leftId = Left.ToString("N");
        string rightId = Right.ToString("D");

        gate.InSequence(sequence).Setup(g => g.EnsureRunReadAllowedAsync(
                It.IsAny<ControllerBase>(), It.IsAny<ClaimsPrincipal>(), Scope, Left, ct))
            .ReturnsAsync((IActionResult?)null);
        gate.InSequence(sequence).Setup(g => g.EnsureRunReadAllowedAsync(
                It.IsAny<ControllerBase>(), It.IsAny<ClaimsPrincipal>(), Scope, Right, ct))
            .ReturnsAsync((IActionResult?)null);
        authority.InSequence(sequence).Setup(q => q.GetRunDetailAsync(Scope, Left, ct))
            .ReturnsAsync((RunDetailDto?)null);
        authority.InSequence(sequence).Setup(q => q.GetRunDetailAsync(Scope, Right, ct))
            .ReturnsAsync((RunDetailDto?)null);
        facade.InSequence(sequence).Setup(f => f.LoadScopedRunPairAsync(leftId, rightId, ct))
            .ReturnsAsync(new ScopedRunPairLoadResult
            {
                Outcome = ScopedRunPairLoadOutcome.RightManifestNotFound,
                MissingRunId = rightId,
            });

        RunComparisonController controller = CreateController(gate.Object, authority.Object, facade.Object);
        IActionResult result = await controller.CompareAgentResults(
            new RunPairQuery { LeftRunId = leftId, RightRunId = rightId }, ct);

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    private static Task<IActionResult> InvokeAsync(
        RunComparisonController controller, string route, RunPairQuery query, CancellationToken ct) =>
        route switch
        {
            "agents" => controller.CompareAgentResults(query, ct),
            "agents-summary" => controller.CompareAgentResultsSummary(query, ct),
            "replay" => controller.CompareRunsEndToEnd(query, ct),
            "replay-summary" => controller.CompareRunsEndToEndSummary(
                query, new PersistComparisonRequest { Persist = true }, ct),
            "markdown" => controller.ExportRunsEndToEndComparisonMarkdown(query, ct),
            "markdown-file" => controller.DownloadRunsEndToEndComparisonMarkdown(query, ct),
            "docx" => controller.ExportRunsEndToEndComparisonDocx(query, ct),
            _ => throw new ArgumentOutOfRangeException(nameof(route)),
        };

    private static RunComparisonController CreateController(
        IArchitectureShareAccessGate gate,
        IAuthorityQueryService? authority = null,
        ICompareRunsApplicationFacade? facade = null)
    {
        Mock<IScopeContextProvider> scopes = new(MockBehavior.Strict);
        scopes.Setup(s => s.GetCurrentScope()).Returns(Scope);

        return new RunComparisonController(
            facade ?? new Mock<ICompareRunsApplicationFacade>(MockBehavior.Strict).Object,
            new Mock<IAgentResultDiffSummaryFormatter>(MockBehavior.Strict).Object,
            new Mock<IEndToEndReplayComparisonService>(MockBehavior.Strict).Object,
            new Mock<IEndToEndReplayComparisonSummaryFormatter>(MockBehavior.Strict).Object,
            new Mock<IEndToEndReplayComparisonExportService>(MockBehavior.Strict).Object,
            new Mock<IComparisonAuditService>(MockBehavior.Strict).Object,
            new Mock<IAuditService>(MockBehavior.Strict).Object,
            scopes.Object,
            authority ?? new Mock<IAuthorityQueryService>(MockBehavior.Strict).Object,
            new Mock<IManifestHashService>(MockBehavior.Strict).Object,
            new RunPairQueryValidator(),
            gate)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };
    }
}
