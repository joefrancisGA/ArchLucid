using System.Text.Json;

using ArchLucid.Api.Controllers.Tenancy;
using ArchLucid.Api.Models.CustomerSuccess;
using ArchLucid.Application.CustomerSuccess;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.CustomerSuccess;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TenantCustomerSuccessControllerTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc")
    };

    private static readonly Guid ForeignWorkspaceId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

    private static ScopeContext ScopeWithWorkspace(Guid workspaceId) =>
        new()
        {
            TenantId = Scope.TenantId,
            WorkspaceId = workspaceId,
            ProjectId = Scope.ProjectId,
        };

    private static void SetupTenantExists(Mock<ITenantRepository> tenants)
    {
        tenants
            .Setup(t => t.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Id = Scope.TenantId });
        tenants
            .Setup(t => t.ListWorkspacesAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new TenantWorkspaceListItem
                {
                    WorkspaceId = Scope.WorkspaceId,
                    Name = "primary",
                },
            ]);
    }

    private static TenantCustomerSuccessController BuildSut(
        ITenantCustomerSuccessRepository repo,
        IScopeContextProvider scopeProvider,
        IRunRepository? runRepository = null,
        IOperatorNextBestActionService? next = null,
        IOperatorStickinessSnapshotReader? stickiness = null,
        ITenantRepository? tenantRepository = null,
        IFindingInspectReadRepository? findingInspect = null)
    {
        Mock<IOperatorNextBestActionService> nextMock = new();
        nextMock.Setup(n => n.GetActionsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<OperatorNextBestActionItem>());

        Mock<IOperatorStickinessSnapshotReader> stickinessMock = new();
        stickinessMock
            .Setup(s => s.GetFunnelSnapshotAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PilotFunnelSnapshot(null, null, null, null, null, 0, 0, 0));

        Mock<IRunRepository> runMock = new();
        runMock
            .Setup(r => r.GetByIdAsync(Scope, It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunRecord?)null);

        Mock<ITenantRepository> tenantMock = new();
        SetupTenantExists(tenantMock);

        Mock<IFindingInspectReadRepository> findingInspectMock = new();
        findingInspectMock
            .Setup(r => r.GetInspectAsync(
                Scope,
                It.IsAny<string>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<FindingInspectReadOptions?>()))
            .ReturnsAsync(new FindingInspectResponse { FindingId = "finding-1" });

        return new TenantCustomerSuccessController(
                repo,
                next ?? nextMock.Object,
                stickiness ?? stickinessMock.Object,
                scopeProvider,
                runRepository ?? runMock.Object,
                tenantRepository ?? tenantMock.Object,
                findingInspect ?? findingInspectMock.Object)
            {
                ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
            };
    }

    [SkippableFact]
    public async Task GetHealthScoreAsync_returns_not_calculated_when_repository_returns_null()
    {
        Mock<ITenantCustomerSuccessRepository> repo = new();
        repo.Setup(r =>
                r.GetHealthScoreAsync(Scope.TenantId, Scope.WorkspaceId, Scope.ProjectId,
                    It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantHealthScoreRecord?)null);
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        TenantCustomerSuccessController sut = BuildSut(repo.Object, scopeProvider.Object);

        IActionResult result = await sut.GetHealthScoreAsync(CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        TenantHealthScoreResponse body = ok.Value.Should().BeAssignableTo<TenantHealthScoreResponse>().Subject;
        body.IsCalculated.Should().BeFalse();
    }

    [SkippableFact]
    public async Task GetHealthScoreAsync_returns_scores_when_repository_has_row()
    {
        DateTimeOffset updated = DateTimeOffset.Parse("2026-04-19T12:00:00Z");
        TenantHealthScoreRecord row = new(
            Scope.TenantId,
            EngagementScore: 4.1M,
            BreadthScore: 3.0M,
            QualityScore: 3.0M,
            GovernanceScore: 3.5M,
            SupportScore: 3.2M,
            CompositeScore: 3.6M,
            UpdatedUtc: updated);
        Mock<ITenantCustomerSuccessRepository> repo = new();
        repo.Setup(r =>
                r.GetHealthScoreAsync(Scope.TenantId, Scope.WorkspaceId, Scope.ProjectId,
                    It.IsAny<CancellationToken>()))
            .ReturnsAsync(row);
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        TenantCustomerSuccessController sut = BuildSut(repo.Object, scopeProvider.Object);
        IActionResult result = await sut.GetHealthScoreAsync(CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        TenantHealthScoreResponse body = ok.Value.Should().BeAssignableTo<TenantHealthScoreResponse>().Subject;
        body.IsCalculated.Should().BeTrue();
        body.EngagementScore.Should().Be(4.1M);
        body.CompositeScore.Should().Be(3.6M);
        body.UpdatedUtc.Should().Be(updated);
    }

    [SkippableFact]
    public void ProductFeedbackRequest_rejects_json_without_score()
    {
        Action act = () => JsonSerializer.Deserialize<ProductFeedbackRequest>("""{"findingRef":"fp-1"}""");

        act.Should().Throw<JsonException>();
    }

    [SkippableFact]
    public async Task PostProductFeedbackAsync_returns_bad_request_when_body_null()
    {
        Mock<ITenantCustomerSuccessRepository> repo = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        TenantCustomerSuccessController sut = BuildSut(repo.Object, scopeProvider.Object);

        IActionResult result = await sut.PostProductFeedbackAsync(null, CancellationToken.None);

        ObjectResult bad = result.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        repo.Verify(
            r => r.InsertProductFeedbackAsync(It.IsAny<ProductFeedbackSubmission>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task PostProductFeedbackAsync_returns_bad_request_when_run_id_is_empty()
    {
        Mock<ITenantCustomerSuccessRepository> repo = new(MockBehavior.Strict);
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        TenantCustomerSuccessController sut = BuildSut(repo.Object, scopeProvider.Object);

        ProductFeedbackRequest request = new()
        {
            RunId = Guid.Empty,
            Score = 1,
        };

        IActionResult result = await sut.PostProductFeedbackAsync(request, CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        repo.VerifyNoOtherCalls();
    }

    [SkippableFact]
    public async Task PostProductFeedbackAsync_rejects_out_of_scope_run_id()
    {
        Guid foreignRunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        Mock<ITenantCustomerSuccessRepository> repo = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, foreignRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunRecord?)null);

        TenantCustomerSuccessController sut = BuildSut(repo.Object, scopeProvider.Object, runs.Object);
        ProductFeedbackRequest request = new()
        {
            RunId = foreignRunId,
            Score = 1,
        };

        IActionResult result = await sut.PostProductFeedbackAsync(request, CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        repo.Verify(
            r => r.InsertProductFeedbackAsync(It.IsAny<ProductFeedbackSubmission>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task PostProductFeedbackAsync_returns_not_found_when_finding_ref_is_out_of_scope()
    {
        Mock<ITenantCustomerSuccessRepository> repo = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        Mock<IFindingInspectReadRepository> findingInspect = new();
        findingInspect
            .Setup(r => r.GetInspectAsync(
                Scope,
                "foreign-finding",
                It.IsAny<CancellationToken>(),
                It.IsAny<FindingInspectReadOptions?>()))
            .ReturnsAsync((FindingInspectResponse?)null);

        TenantCustomerSuccessController sut = BuildSut(
            repo.Object,
            scopeProvider.Object,
            findingInspect: findingInspect.Object);

        ProductFeedbackRequest request = new()
        {
            FindingRef = "foreign-finding",
            Score = 1,
        };

        IActionResult result = await sut.PostProductFeedbackAsync(request, CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        repo.Verify(
            r => r.InsertProductFeedbackAsync(It.IsAny<ProductFeedbackSubmission>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task PostProductFeedbackAsync_returns_bad_request_when_run_id_does_not_match_finding_authority_run()
    {
        Guid authorityRunId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid otherInScopeRunId = Guid.Parse("22222222-2222-2222-2222-222222222222");

        Mock<ITenantCustomerSuccessRepository> repo = new(MockBehavior.Strict);
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        Mock<IRunRepository> runs = new(MockBehavior.Strict);
        runs
            .Setup(r => r.GetByIdAsync(Scope, otherInScopeRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = otherInScopeRunId });

        Mock<IFindingInspectReadRepository> findingInspect = new(MockBehavior.Strict);
        findingInspect
            .Setup(r => r.GetInspectAsync(
                Scope,
                "finding-1",
                It.IsAny<CancellationToken>(),
                It.IsAny<FindingInspectReadOptions?>()))
            .ReturnsAsync(new FindingInspectResponse
            {
                FindingId = "finding-1",
                RunId = authorityRunId,
            });

        TenantCustomerSuccessController sut = BuildSut(
            repo.Object,
            scopeProvider.Object,
            runs.Object,
            findingInspect: findingInspect.Object);

        ProductFeedbackRequest request = new()
        {
            FindingRef = "finding-1",
            RunId = otherInScopeRunId,
            Score = 1,
        };

        IActionResult result = await sut.PostProductFeedbackAsync(request, CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        repo.VerifyNoOtherCalls();
    }

    [SkippableFact]
    public async Task PostProductFeedbackAsync_returns_bad_request_when_finding_ref_has_authority_run_and_run_id_omitted()
    {
        Guid authorityRunId = Guid.Parse("11111111-1111-1111-1111-111111111111");

        Mock<ITenantCustomerSuccessRepository> repo = new(MockBehavior.Strict);
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        Mock<IFindingInspectReadRepository> findingInspect = new(MockBehavior.Strict);
        findingInspect
            .Setup(r => r.GetInspectAsync(
                Scope,
                "finding-1",
                It.IsAny<CancellationToken>(),
                It.IsAny<FindingInspectReadOptions?>()))
            .ReturnsAsync(new FindingInspectResponse
            {
                FindingId = "finding-1",
                RunId = authorityRunId,
            });

        TenantCustomerSuccessController sut = BuildSut(
            repo.Object,
            scopeProvider.Object,
            findingInspect: findingInspect.Object);

        ProductFeedbackRequest request = new()
        {
            FindingRef = "finding-1",
            Score = 1,
        };

        IActionResult result = await sut.PostProductFeedbackAsync(request, CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        repo.VerifyNoOtherCalls();
    }

    [SkippableFact]
    public async Task PostProductFeedbackAsync_returns_bad_request_when_finding_ref_exceeds_max_length()
    {
        string overlongFindingRef = new string('f', 513);

        Mock<ITenantCustomerSuccessRepository> repo = new(MockBehavior.Strict);
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        Mock<IFindingInspectReadRepository> findingInspect = new(MockBehavior.Strict);

        TenantCustomerSuccessController sut = BuildSut(
            repo.Object,
            scopeProvider.Object,
            findingInspect: findingInspect.Object);

        ProductFeedbackRequest request = new()
        {
            FindingRef = overlongFindingRef,
            Score = 1,
        };

        IActionResult result = await sut.PostProductFeedbackAsync(request, CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        findingInspect.Verify(
            r => r.GetInspectAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<FindingInspectReadOptions?>()),
            Times.Never);
        repo.VerifyNoOtherCalls();
    }

    [SkippableFact]
    public async Task PostProductFeedbackAsync_returns_bad_request_when_finding_ref_exceeds_finding_id_max_length()
    {
        string overlongFindingRef = new string('f', 65);

        Mock<ITenantCustomerSuccessRepository> repo = new(MockBehavior.Strict);
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        Mock<IFindingInspectReadRepository> findingInspect = new(MockBehavior.Strict);

        TenantCustomerSuccessController sut = BuildSut(
            repo.Object,
            scopeProvider.Object,
            findingInspect: findingInspect.Object);

        ProductFeedbackRequest request = new()
        {
            FindingRef = overlongFindingRef,
            Score = 1,
        };

        IActionResult result = await sut.PostProductFeedbackAsync(request, CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        findingInspect.VerifyNoOtherCalls();
        repo.VerifyNoOtherCalls();
    }

    [SkippableFact]
    public async Task PostProductFeedbackAsync_returns_bad_request_when_comment_exceeds_max_length()
    {
        Mock<ITenantCustomerSuccessRepository> repo = new(MockBehavior.Strict);
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        TenantCustomerSuccessController sut = BuildSut(repo.Object, scopeProvider.Object);

        ProductFeedbackRequest request = new()
        {
            Score = 1,
            Comment = new string('x', 2001),
        };

        IActionResult result = await sut.PostProductFeedbackAsync(request, CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        repo.VerifyNoOtherCalls();
    }

    [SkippableFact]
    public async Task PostProductFeedbackAsync_omits_finding_ref_when_value_is_whitespace()
    {
        ProductFeedbackSubmission? captured = null;
        Mock<ITenantCustomerSuccessRepository> repo = new();
        repo.Setup(r =>
                r.InsertProductFeedbackAsync(It.IsAny<ProductFeedbackSubmission>(), It.IsAny<CancellationToken>()))
            .Callback<ProductFeedbackSubmission, CancellationToken>((s, _) => captured = s)
            .Returns(Task.CompletedTask);
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        Mock<IFindingInspectReadRepository> findingInspect = new();

        TenantCustomerSuccessController sut = BuildSut(
            repo.Object,
            scopeProvider.Object,
            findingInspect: findingInspect.Object);

        ProductFeedbackRequest request = new()
        {
            FindingRef = "   ",
            Score = 1,
        };

        IActionResult result = await sut.PostProductFeedbackAsync(request, CancellationToken.None);

        result.Should().BeOfType<NoContentResult>();
        captured.Should().NotBeNull();
        captured!.FindingRef.Should().BeNull();
        findingInspect.Verify(
            r => r.GetInspectAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<FindingInspectReadOptions?>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task PostProductFeedbackAsync_persists_and_returns_no_content()
    {
        ProductFeedbackSubmission? captured = null;
        Mock<ITenantCustomerSuccessRepository> repo = new();
        repo.Setup(r =>
                r.InsertProductFeedbackAsync(It.IsAny<ProductFeedbackSubmission>(), It.IsAny<CancellationToken>()))
            .Callback<ProductFeedbackSubmission, CancellationToken>((s, _) => captured = s)
            .Returns(Task.CompletedTask);
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = runId });

        TenantCustomerSuccessController sut = BuildSut(repo.Object, scopeProvider.Object, runs.Object);
        ProductFeedbackRequest request = new()
        {
            FindingRef = "finding-1",
            RunId = runId,
            Score = 1,
            Comment = "ok"
        };

        IActionResult result = await sut.PostProductFeedbackAsync(request, CancellationToken.None);

        result.Should().BeOfType<NoContentResult>();
        captured.Should().NotBeNull();
        captured!.TenantId.Should().Be(Scope.TenantId);
        captured.WorkspaceId.Should().Be(Scope.WorkspaceId);
        captured.ProjectId.Should().Be(Scope.ProjectId);
        captured.FindingRef.Should().Be("finding-1");
        captured.RunId.Should().Be(request.RunId);
        captured.Score.Should().Be(1);
        captured.Comment.Should().Be("ok");
        repo.Verify(
            r => r.InsertProductFeedbackAsync(It.IsAny<ProductFeedbackSubmission>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task PostProductFeedbackAsync_returns_not_found_when_tenant_missing()
    {
        Mock<ITenantCustomerSuccessRepository> repo = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(t => t.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantRecord?)null);

        TenantCustomerSuccessController sut = BuildSut(
            repo.Object,
            scopeProvider.Object,
            tenantRepository: tenants.Object);

        ProductFeedbackRequest request = new()
        {
            Score = 1,
        };

        IActionResult result = await sut.PostProductFeedbackAsync(request, CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        repo.Verify(
            r => r.InsertProductFeedbackAsync(It.IsAny<ProductFeedbackSubmission>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task PostProductFeedbackAsync_returns_bad_request_when_run_id_is_empty_and_tenant_missing()
    {
        Mock<ITenantCustomerSuccessRepository> repo = new(MockBehavior.Strict);
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(t => t.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantRecord?)null);

        TenantCustomerSuccessController sut = BuildSut(
            repo.Object,
            scopeProvider.Object,
            tenantRepository: tenants.Object);

        ProductFeedbackRequest request = new()
        {
            RunId = Guid.Empty,
            Score = 1,
        };

        IActionResult result = await sut.PostProductFeedbackAsync(request, CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        repo.VerifyNoOtherCalls();
        tenants.Verify(
            t => t.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task PostProductFeedbackAsync_returns_bad_request_when_comment_exceeds_max_length_and_tenant_missing()
    {
        Mock<ITenantCustomerSuccessRepository> repo = new(MockBehavior.Strict);

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(t => t.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantRecord?)null);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        TenantCustomerSuccessController sut = BuildSut(
            repo.Object,
            scopeProvider.Object,
            tenantRepository: tenants.Object);

        ProductFeedbackRequest request = new()
        {
            Score = 1,
            Comment = new string('c', 2001),
        };

        IActionResult result = await sut.PostProductFeedbackAsync(request, CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        repo.VerifyNoOtherCalls();
        tenants.Verify(
            t => t.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task GetStickinessSnapshotAsync_merges_funnel_and_signals()
    {
        Mock<ITenantCustomerSuccessRepository> repo = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        Mock<IOperatorStickinessSnapshotReader> stickiness = new();
        DateTime firstRun = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        stickiness
            .Setup(s => s.GetFunnelSnapshotAsync(Scope.TenantId, Scope.WorkspaceId, Scope.ProjectId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PilotFunnelSnapshot(firstRun, null, null, null, null, 3, 2, 4));
        stickiness
            .Setup(s => s.GetOperatorSignalsAsync(Scope.TenantId, Scope.WorkspaceId, Scope.ProjectId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new OperatorStickinessSignals(3, 2, Guid.NewGuid(), 5, 1));

        TenantCustomerSuccessController sut = BuildSut(repo.Object, scopeProvider.Object, stickiness: stickiness.Object);
        IActionResult result = await sut.GetStickinessSnapshotAsync(CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        OperatorStickinessSnapshotResponse body = ok.Value.Should().BeAssignableTo<OperatorStickinessSnapshotResponse>().Subject;
        body.PilotFunnel.TotalRunsInScope.Should().Be(3);
        body.PilotFunnel.CommittedRunsInScope.Should().Be(2);
        body.ComparisonEventsLast30Days.Should().Be(5);
        body.PendingGovernanceApprovals.Should().Be(1);
    }

    [Fact]
    public async Task GetHealthScoreAsync_returns_not_found_when_tenant_missing()
    {
        Mock<ITenantCustomerSuccessRepository> repo = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(t => t.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantRecord?)null);

        TenantCustomerSuccessController sut = BuildSut(repo.Object, scopeProvider.Object, tenantRepository: tenants.Object);

        IActionResult result = await sut.GetHealthScoreAsync(CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        repo.Verify(
            r => r.GetHealthScoreAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task GetNextBestActionsAsync_returns_not_found_when_tenant_missing()
    {
        Mock<ITenantCustomerSuccessRepository> repo = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(t => t.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantRecord?)null);

        Mock<IOperatorNextBestActionService> next = new();

        TenantCustomerSuccessController sut = BuildSut(
            repo.Object,
            scopeProvider.Object,
            next: next.Object,
            tenantRepository: tenants.Object);

        IActionResult result = await sut.GetNextBestActionsAsync(CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        next.Verify(n => n.GetActionsAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task GetFunnelSnapshotAsync_returns_not_found_when_tenant_missing()
    {
        Mock<ITenantCustomerSuccessRepository> repo = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(t => t.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantRecord?)null);

        Mock<IOperatorStickinessSnapshotReader> stickiness = new();

        TenantCustomerSuccessController sut = BuildSut(
            repo.Object,
            scopeProvider.Object,
            stickiness: stickiness.Object,
            tenantRepository: tenants.Object);

        IActionResult result = await sut.GetFunnelSnapshotAsync(CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        stickiness.Verify(
            s => s.GetFunnelSnapshotAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task GetStickinessSnapshotAsync_returns_not_found_when_tenant_missing()
    {
        Mock<ITenantCustomerSuccessRepository> repo = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(t => t.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantRecord?)null);

        Mock<IOperatorStickinessSnapshotReader> stickiness = new();

        TenantCustomerSuccessController sut = BuildSut(
            repo.Object,
            scopeProvider.Object,
            stickiness: stickiness.Object,
            tenantRepository: tenants.Object);

        IActionResult result = await sut.GetStickinessSnapshotAsync(CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        stickiness.Verify(
            s => s.GetFunnelSnapshotAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
        stickiness.Verify(
            s => s.GetOperatorSignalsAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task GetHealthScoreAsync_returns_not_found_when_workspace_missing()
    {
        Mock<ITenantCustomerSuccessRepository> repo = new(MockBehavior.Strict);
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(ScopeWithWorkspace(ForeignWorkspaceId));

        Mock<ITenantRepository> tenants = new();
        SetupTenantExists(tenants);

        TenantCustomerSuccessController sut = BuildSut(repo.Object, scopeProvider.Object, tenantRepository: tenants.Object);

        IActionResult result = await sut.GetHealthScoreAsync(CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        repo.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetNextBestActionsAsync_returns_not_found_when_workspace_missing()
    {
        Mock<ITenantCustomerSuccessRepository> repo = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(ScopeWithWorkspace(ForeignWorkspaceId));

        Mock<ITenantRepository> tenants = new();
        SetupTenantExists(tenants);

        Mock<IOperatorNextBestActionService> next = new(MockBehavior.Strict);

        TenantCustomerSuccessController sut = BuildSut(
            repo.Object,
            scopeProvider.Object,
            next: next.Object,
            tenantRepository: tenants.Object);

        IActionResult result = await sut.GetNextBestActionsAsync(CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        next.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetFunnelSnapshotAsync_returns_not_found_when_workspace_missing()
    {
        Mock<ITenantCustomerSuccessRepository> repo = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(ScopeWithWorkspace(ForeignWorkspaceId));

        Mock<ITenantRepository> tenants = new();
        SetupTenantExists(tenants);

        Mock<IOperatorStickinessSnapshotReader> stickiness = new(MockBehavior.Strict);

        TenantCustomerSuccessController sut = BuildSut(
            repo.Object,
            scopeProvider.Object,
            stickiness: stickiness.Object,
            tenantRepository: tenants.Object);

        IActionResult result = await sut.GetFunnelSnapshotAsync(CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        stickiness.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetStickinessSnapshotAsync_returns_not_found_when_workspace_missing()
    {
        Mock<ITenantCustomerSuccessRepository> repo = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(ScopeWithWorkspace(ForeignWorkspaceId));

        Mock<ITenantRepository> tenants = new();
        SetupTenantExists(tenants);

        Mock<IOperatorStickinessSnapshotReader> stickiness = new(MockBehavior.Strict);

        TenantCustomerSuccessController sut = BuildSut(
            repo.Object,
            scopeProvider.Object,
            stickiness: stickiness.Object,
            tenantRepository: tenants.Object);

        IActionResult result = await sut.GetStickinessSnapshotAsync(CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        stickiness.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task PostProductFeedbackAsync_returns_not_found_when_workspace_missing()
    {
        Mock<ITenantCustomerSuccessRepository> repo = new(MockBehavior.Strict);
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(ScopeWithWorkspace(ForeignWorkspaceId));

        Mock<ITenantRepository> tenants = new();
        SetupTenantExists(tenants);

        TenantCustomerSuccessController sut = BuildSut(repo.Object, scopeProvider.Object, tenantRepository: tenants.Object);

        IActionResult result = await sut.PostProductFeedbackAsync(
            new ProductFeedbackRequest { Score = 1 },
            CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        repo.VerifyNoOtherCalls();
    }
}
