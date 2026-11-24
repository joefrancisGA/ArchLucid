using ArchLucid.Api.Controllers.Findings;
using ArchLucid.Api.Support;
using ArchLucid.Application.Findings;
using ArchLucid.Application.Integrations.Itsm;
using ArchLucid.Application.Integrations.Itsm.Outbound;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Persistence.ApplicationPorts.Findings;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class FindingInspectControllerShareAccessTests
{
    private const string FindingId = "finding-one";
    private static readonly Guid RunId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
    };

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Missing_or_empty_owner_never_reads_payload(bool empty)
    {
        Harness h = new();
        h.Findings.Setup(f => f.GetRunIdByFindingIdAsync(Scope, FindingId, CancellationToken.None))
            .ReturnsAsync(empty ? Guid.Empty : (Guid?)null);

        Assert404(await h.Controller.GetInspectAsync(" " + FindingId + " ", true, CancellationToken.None));

        h.Findings.Verify(f => f.GetRunIdByFindingIdAsync(Scope, FindingId, CancellationToken.None), Times.Once);
        h.Findings.VerifyNoOtherCalls();
        h.Gate.VerifyNoOtherCalls();
        h.AssertNoEnrichment();
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Denied_run_never_hydrates_either_projection(bool includeTypedPayload)
    {
        Harness h = new();
        h.Owner();
        h.Gate.Setup(g => g.EnsureRunReadAllowedAsync(h.Controller, h.Controller.User, Scope, RunId,
            CancellationToken.None)).ReturnsAsync((IActionResult?)new NotFoundResult());

        Assert404(await h.Controller.GetInspectAsync(FindingId, includeTypedPayload, CancellationToken.None));

        h.Findings.Verify(f => f.GetRunIdByFindingIdAsync(Scope, FindingId, CancellationToken.None), Times.Once);
        h.Findings.VerifyNoOtherCalls();
        h.AssertNoEnrichment();
    }

    [Theory]
    [InlineData("missing")]
    [InlineData("run")]
    [InlineData("finding")]
    public async Task Hydration_must_return_the_authorized_run_and_requested_finding(string mismatch)
    {
        Harness h = new();
        h.Owner();
        h.Allow();
        h.Findings.Setup(f => f.GetInspectAsync(Scope, FindingId, CancellationToken.None,
                It.Is<FindingInspectReadOptions>(o => o.ExpectedRunId == RunId && o.IncludeTypedPayload)))
            .ReturnsAsync(mismatch == "missing" ? null : new FindingInspectResponse
            {
                RunId = mismatch == "run" ? Guid.NewGuid() : RunId,
                FindingId = mismatch == "finding" ? "different" : FindingId,
            });

        Assert404(await h.Controller.GetInspectAsync(FindingId, true, CancellationToken.None));

        h.AssertNoEnrichment();
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Authorized_projection_uses_exact_owner_before_seal_and_tracking(bool includeTypedPayload)
    {
        Harness h = new();
        FindingInspectResponse body = new() { RunId = RunId, FindingId = FindingId };
        ManifestDocument manifest = new() { RunId = RunId, ManifestHash = "sealed" };
        MockSequence sequence = new();
        h.Findings.InSequence(sequence).Setup(f => f.GetRunIdByFindingIdAsync(Scope, FindingId, CancellationToken.None))
            .ReturnsAsync((Guid?)RunId);
        h.Gate.InSequence(sequence).Setup(g => g.EnsureRunReadAllowedAsync(h.Controller,
            h.Controller.User, Scope, RunId, CancellationToken.None)).ReturnsAsync((IActionResult?)null);
        h.Findings.InSequence(sequence).Setup(f => f.GetInspectAsync(Scope, FindingId, CancellationToken.None,
                It.Is<FindingInspectReadOptions>(o => o.ExpectedRunId == RunId &&
                    o.IncludeTypedPayload == includeTypedPayload))).ReturnsAsync(body);
        h.Authority.InSequence(sequence).Setup(q => q.GetRunDetailAsync(Scope, RunId, CancellationToken.None))
            .ReturnsAsync(new RunDetailDto { GoldenManifest = manifest });
        h.Hash.InSequence(sequence).Setup(x => x.ComputeHash(manifest)).Returns("sealed");
        h.Tracking.InSequence(sequence).Setup(t => t.ListForAuthorizedRunFindingsAsync(
            Scope, RunId, It.Is<IReadOnlyList<string>>(ids => ids.Count == 1 && ids[0] == FindingId),
            CancellationToken.None)).ReturnsAsync(new Dictionary<string, RunFindingExternalTrackingReadRow>());
        h.Reasoning.InSequence(sequence).Setup(r => r.TryBuild(body)).Returns("verified summary");

        IActionResult result = await h.Controller.GetInspectAsync(" " + FindingId + " ", includeTypedPayload,
            CancellationToken.None);

        FindingInspectResponse response = result.Should().BeOfType<OkObjectResult>().Which.Value
            .Should().BeOfType<FindingInspectResponse>().Subject;
        response.RunId.Should().Be(RunId);
        response.FindingId.Should().Be(FindingId);
        response.ReasoningSummary.Should().Be("verified summary");
        h.Tracking.Verify(t => t.ListForFindingsAsync(It.IsAny<Guid>(), It.IsAny<Guid?>(),
            It.IsAny<IReadOnlyList<string>>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Failed_seal_never_loads_tracking_or_reasoning()
    {
        Harness h = new();
        h.Owner();
        h.Allow();
        h.Findings.Setup(f => f.GetInspectAsync(Scope, FindingId, CancellationToken.None,
                It.Is<FindingInspectReadOptions>(o => o.ExpectedRunId == RunId)))
            .ReturnsAsync(new FindingInspectResponse { RunId = RunId, FindingId = FindingId });
        ManifestDocument manifest = new() { RunId = RunId, ManifestHash = "sealed" };
        h.Authority.Setup(q => q.GetRunDetailAsync(Scope, RunId, CancellationToken.None))
            .ReturnsAsync(new RunDetailDto { GoldenManifest = manifest });
        h.Hash.Setup(x => x.ComputeHash(manifest)).Returns("tampered");

        (await h.Controller.GetInspectAsync(FindingId, true, CancellationToken.None))
            .Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status409Conflict);
        h.Tracking.VerifyNoOtherCalls();
        h.Reasoning.VerifyNoOtherCalls();
    }

    private static void Assert404(IActionResult result) =>
        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status404NotFound);

    private sealed class Harness
    {
        public Mock<IFindingInspectReadRepository> Findings { get; } = new(MockBehavior.Strict);
        public Mock<IArchitectureShareAccessGate> Gate { get; } = new(MockBehavior.Strict);
        public Mock<IAuthorityQueryService> Authority { get; } = new(MockBehavior.Strict);
        public Mock<IManifestHashService> Hash { get; } = new(MockBehavior.Strict);
        public Mock<IRunFindingExternalTrackingReadRepository> Tracking { get; } = new(MockBehavior.Strict);
        public Mock<IReasoningSummaryBuilder> Reasoning { get; } = new(MockBehavior.Strict);
        public FindingInspectController Controller { get; }

        public Harness()
        {
            Mock<IScopeContextProvider> scopes = new(MockBehavior.Strict);
            scopes.Setup(s => s.GetCurrentScope()).Returns(Scope);
            Controller = new FindingInspectController(Findings.Object, Reasoning.Object,
                new RunFindingExternalTrackingEnrichmentService(Tracking.Object,
                    new ItsmExternalTicketUrlBuilder(new Mock<IExternalTicketConnectorRegistry>(MockBehavior.Strict).Object)),
                new FindingTrustLabelMapper(), scopes.Object, Authority.Object, Hash.Object, Gate.Object)
            {
                ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
            };
        }

        public void Owner() => Findings.Setup(f => f.GetRunIdByFindingIdAsync(
            Scope, FindingId, CancellationToken.None)).ReturnsAsync((Guid?)RunId);

        public void Allow() => Gate.Setup(g => g.EnsureRunReadAllowedAsync(Controller, Controller.User, Scope, RunId,
            CancellationToken.None)).ReturnsAsync((IActionResult?)null);

        public void AssertNoEnrichment()
        {
            Authority.VerifyNoOtherCalls();
            Hash.VerifyNoOtherCalls();
            Tracking.VerifyNoOtherCalls();
            Reasoning.VerifyNoOtherCalls();
        }
    }
}
