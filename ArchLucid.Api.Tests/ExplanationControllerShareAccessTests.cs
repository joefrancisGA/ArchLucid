using System.Security.Claims;

using ArchLucid.Api.Controllers.Planning;
using ArchLucid.Api.Support;
using ArchLucid.Application.Analysis;
using ArchLucid.Application.Explanation;
using ArchLucid.Application.Explanation.Models;
using ArchLucid.Contracts.Explanation;
using ArchLucid.Core.Explanation;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Provenance;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ExplanationControllerShareAccessTests
{
    private static readonly Guid A = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid B = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
    };

    [Theory]
    [InlineData("explain")]
    [InlineData("aggregate")]
    [InlineData("finding")]
    [InlineData("audit")]
    [InlineData("holistic")]
    public async Task Denied_single_run_stops_before_any_evidence_or_cache_read(string route)
    {
        Harness h = new();
        NotFoundResult denial = new();
        h.Gate.Setup(g => g.EnsureRunReadAllowedAsync(h.Controller, h.Controller.User, Scope, A,
            CancellationToken.None)).ReturnsAsync((IActionResult?)denial);

        IActionResult response = await Invoke(h.Controller, route, A);

        response.Should().BeSameAs(denial);
        h.Gate.Verify(g => g.EnsureRunReadAllowedAsync(h.Controller, h.Controller.User, Scope, A,
            CancellationToken.None), Times.Once);
        h.Gate.VerifyNoOtherCalls();
        h.VerifyNoPayloadCalls();
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Denied_comparison_anchor_stops_before_either_payload(bool denyTarget)
    {
        Harness h = new();
        NotFoundResult denial = new();
        if (denyTarget)
            h.Gate.Setup(g => g.EnsureRunReadAllowedAsync(h.Controller, h.Controller.User, Scope, A,
                CancellationToken.None)).ReturnsAsync((IActionResult?)null);
        h.Gate.Setup(g => g.EnsureRunReadAllowedAsync(h.Controller, h.Controller.User, Scope,
            denyTarget ? B : A, CancellationToken.None)).ReturnsAsync((IActionResult?)denial);

        (await h.Controller.ExplainComparison(A, B, CancellationToken.None)).Should().BeSameAs(denial);

        if (denyTarget)
            h.Gate.Verify(g => g.EnsureRunReadAllowedAsync(h.Controller, h.Controller.User, Scope, A,
                CancellationToken.None), Times.Once);
        h.Gate.Verify(g => g.EnsureRunReadAllowedAsync(h.Controller, h.Controller.User, Scope,
            denyTarget ? B : A, CancellationToken.None), Times.Once);
        h.Gate.VerifyNoOtherCalls();
        h.VerifyNoPayloadCalls();
    }

    [Theory]
    [InlineData("explain")]
    [InlineData("aggregate")]
    [InlineData("finding")]
    [InlineData("audit")]
    [InlineData("holistic")]
    public async Task Empty_run_id_does_not_reach_authorization_or_payload(string route)
    {
        Harness h = new();

        (await Invoke(h.Controller, route, Guid.Empty)).Should().BeOfType<ObjectResult>()
            .Which.StatusCode.Should().Be(StatusCodes.Status404NotFound);

        h.Gate.VerifyNoOtherCalls();
        h.VerifyNoPayloadCalls();
    }

    [Fact]
    public async Task Both_comparison_authorizations_precede_seal_reads_and_facade()
    {
        Harness h = new();
        MockSequence sequence = new();
        h.Gate.InSequence(sequence).Setup(g => g.EnsureRunReadAllowedAsync(h.Controller,
            h.Controller.User, Scope, A, CancellationToken.None)).ReturnsAsync((IActionResult?)null);
        h.Gate.InSequence(sequence).Setup(g => g.EnsureRunReadAllowedAsync(h.Controller,
            h.Controller.User, Scope, B, CancellationToken.None)).ReturnsAsync((IActionResult?)null);
        h.Query.InSequence(sequence).Setup(q => q.GetRunDetailAsync(Scope, A, CancellationToken.None))
            .ReturnsAsync((RunDetailDto?)null);
        h.Query.InSequence(sequence).Setup(q => q.GetRunDetailAsync(Scope, B, CancellationToken.None))
            .ReturnsAsync((RunDetailDto?)null);
        h.Compare.InSequence(sequence).Setup(q => q.CompareManifestsAsync(A, B, CancellationToken.None))
            .ReturnsAsync(new ManifestCompareLoadResult { Outcome = ManifestCompareLoadOutcome.TargetManifestNotFound, RunId = B });

        (await h.Controller.ExplainComparison(A, B, CancellationToken.None)).Should().BeOfType<ObjectResult>()
            .Which.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        h.Compare.Verify(q => q.CompareManifestsAsync(A, B, CancellationToken.None), Times.Once);
    }

    [Fact]
    public async Task Aggregate_rechecks_sharing_on_every_request_before_summary_cache()
    {
        Harness h = new();
        h.Gate.SetupSequence(g => g.EnsureRunReadAllowedAsync(h.Controller, h.Controller.User,
            Scope, A, CancellationToken.None))
            .ReturnsAsync((IActionResult?)null)
            .ReturnsAsync((IActionResult?)new NotFoundResult());
        h.Query.Setup(q => q.GetRunDetailAsync(Scope, A, CancellationToken.None))
            .ReturnsAsync(new RunDetailDto
            {
                GoldenManifest = new ManifestDocument { ManifestHash = "sealed", RunId = A },
            });
        h.Hash.Setup(m => m.ComputeHash(It.IsAny<ManifestDocument>())).Returns("sealed");
        h.Summary.Setup(s => s.GetSummaryAsync(Scope, A, CancellationToken.None))
            .ReturnsAsync(new RunExplanationSummary { FindingCount = 0 });

        (await h.Controller.AggregateRunExplanation(A, CancellationToken.None)).Should().BeOfType<OkObjectResult>();
        (await h.Controller.AggregateRunExplanation(A, CancellationToken.None)).Should().BeOfType<NotFoundResult>();

        h.Query.Verify(q => q.GetRunDetailAsync(Scope, A, CancellationToken.None), Times.Once);
        h.Summary.Verify(s => s.GetSummaryAsync(Scope, A, CancellationToken.None), Times.Once);
    }

    private static Task<IActionResult> Invoke(ExplanationController controller, string route, Guid runId) =>
        route switch
        {
            "explain" => controller.ExplainRun(runId, CancellationToken.None),
            "aggregate" => controller.AggregateRunExplanation(runId, CancellationToken.None),
            "finding" => controller.GetFindingExplainability(runId, "finding", CancellationToken.None),
            "audit" => controller.GetFindingLlmAudit(runId, "finding", CancellationToken.None),
            "holistic" => controller.HolisticCritic(runId, null, CancellationToken.None),
            _ => throw new ArgumentOutOfRangeException(nameof(route)),
        };

    private sealed class Harness
    {
        public Mock<IArchitectureShareAccessGate> Gate { get; } = new(MockBehavior.Strict);
        public Mock<IAuthorityQueryService> Query { get; } = new(MockBehavior.Strict);
        public Mock<ICompareRunsApplicationFacade> Compare { get; } = new(MockBehavior.Strict);
        public Mock<IExplanationService> Explain { get; } = new(MockBehavior.Strict);
        public Mock<IRunExplanationSummaryService> Summary { get; } = new(MockBehavior.Strict);
        public Mock<IFindingExplainabilityComposer> Findings { get; } = new(MockBehavior.Strict);
        public Mock<IFindingLlmAuditService> Audit { get; } = new(MockBehavior.Strict);
        public Mock<IProvenanceSnapshotRepository> Provenance { get; } = new(MockBehavior.Strict);
        public Mock<IHolisticCriticService> Critic { get; } = new(MockBehavior.Strict);
        public Mock<IManifestHashService> Hash { get; } = new(MockBehavior.Strict);
        public ExplanationController Controller { get; }

        public Harness()
        {
            Mock<IScopeContextProvider> scope = new(MockBehavior.Strict);
            scope.Setup(p => p.GetCurrentScope()).Returns(Scope);
            Controller = new ExplanationController(Query.Object, Compare.Object, Explain.Object,
                Summary.Object, Findings.Object, Audit.Object, Provenance.Object, scope.Object,
                Critic.Object, Hash.Object, NullLogger<ExplanationController>.Instance, Gate.Object)
            {
                ControllerContext = new ControllerContext
                {
                    HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(new ClaimsIdentity()) },
                },
            };
        }

        public void VerifyNoPayloadCalls()
        {
            Query.VerifyNoOtherCalls();
            Compare.VerifyNoOtherCalls();
            Explain.VerifyNoOtherCalls();
            Summary.VerifyNoOtherCalls();
            Findings.VerifyNoOtherCalls();
            Audit.VerifyNoOtherCalls();
            Provenance.VerifyNoOtherCalls();
            Critic.VerifyNoOtherCalls();
            Hash.VerifyNoOtherCalls();
        }
    }
}
