using System.Security.Claims;

using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Api.Support;
using ArchLucid.Application.Audit;
using ArchLucid.Application.Common;
using ArchLucid.Application.Explanation;
using ArchLucid.Application.Provenance;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Traceability;
using ArchLucid.Core.Audit;
using ArchLucid.Core.DevTesting;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AuthorityReadsControllerShareAccessTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    private static readonly Guid RunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

    private readonly ClaimsPrincipal _principal = new(new ClaimsIdentity("Test"));
    private readonly Mock<IAuthorityQueryService> _query = new(MockBehavior.Strict);
    private readonly Mock<ITraceabilityBundleExportApplicationService> _export = new(MockBehavior.Strict);
    private readonly Mock<IArchitectureShareAccessGate> _gate = new(MockBehavior.Strict);

    [Theory]
    [InlineData(nameof(AuthorityReadsController.GetRunDetail))]
    [InlineData(nameof(AuthorityReadsController.GetRunManifest))]
    [InlineData(nameof(AuthorityReadsController.GetReviewTrail))]
    [InlineData(nameof(AuthorityReadsController.GetReviewTrailRationale))]
    [InlineData(nameof(AuthorityReadsController.GetReviewTrailProvenance))]
    [InlineData(nameof(AuthorityReadsController.GetReviewTrailExport))]
    public async Task Restricted_run_returns_share_denial_before_protected_reads_or_zip_generation(string action)
    {
        using CancellationTokenSource cancellation = new();
        CancellationToken ct = cancellation.Token;
        AuthorityReadsController controller = BuildController();
        IActionResult denial = ArchitectureShareNotVisibleAsNotFoundResponsePolicy.RunNotFound(controller, RunId);
        _gate.Setup(g => g.EnsureRunReadAllowedAsync(controller, _principal, Scope, RunId, ct))
            .ReturnsAsync(denial);

        IActionResult response = action switch
        {
            nameof(AuthorityReadsController.GetRunDetail) => await controller.GetRunDetail(RunId, ct),
            nameof(AuthorityReadsController.GetRunManifest) => await controller.GetRunManifest(RunId, ct),
            nameof(AuthorityReadsController.GetReviewTrail) => await controller.GetReviewTrail(RunId, ct),
            nameof(AuthorityReadsController.GetReviewTrailRationale) => await controller.GetReviewTrailRationale(RunId, ct),
            nameof(AuthorityReadsController.GetReviewTrailProvenance) => await controller.GetReviewTrailProvenance(RunId, ct),
            nameof(AuthorityReadsController.GetReviewTrailExport) => await controller.GetReviewTrailExport(RunId, ct),
            _ => throw new InvalidOperationException(action),
        };

        response.Should().BeSameAs(denial);
        response.Should().BeAssignableTo<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        _gate.Verify(g => g.EnsureRunReadAllowedAsync(controller, _principal, Scope, RunId, ct), Times.Once);
        _gate.VerifyNoOtherCalls();
        _query.VerifyNoOtherCalls();
        _export.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Allowed_run_checks_sharing_before_scoped_detail_read()
    {
        using CancellationTokenSource cancellation = new();
        CancellationToken ct = cancellation.Token;
        AuthorityReadsController controller = BuildController();
        MockSequence sequence = new();
        _gate.InSequence(sequence)
            .Setup(g => g.EnsureRunReadAllowedAsync(controller, _principal, Scope, RunId, ct))
            .ReturnsAsync((IActionResult?)null);
        _query.InSequence(sequence)
            .Setup(q => q.GetRunDetailAsync(Scope, RunId, ct))
            .ReturnsAsync((RunDetailDto?)null);

        IActionResult response = await controller.GetRunDetail(RunId, ct);

        response.Should().BeAssignableTo<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        _gate.Verify(g => g.EnsureRunReadAllowedAsync(controller, _principal, Scope, RunId, ct), Times.Once);
        _query.Verify(q => q.GetRunDetailAsync(Scope, RunId, ct), Times.Once);
    }

    private AuthorityReadsController BuildController()
    {
        Mock<IScopeContextProvider> scopeProvider = new(MockBehavior.Strict);
        scopeProvider.Setup(p => p.GetCurrentScope()).Returns(Scope);
        IManifestHashService manifestHash = new Mock<IManifestHashService>(MockBehavior.Strict).Object;

        AuthorityRunReadHandlers readHandlers = new(
            _query.Object,
            new Mock<IAuthorityRunDetailOperatorEnricher>(MockBehavior.Strict).Object,
            new Mock<IRunRationaleService>(MockBehavior.Strict).Object,
            new Mock<IRunPipelineAuditTimelineService>(MockBehavior.Strict).Object,
            scopeProvider.Object,
            new Mock<IProvenanceGraphAccessService>(MockBehavior.Strict).Object,
            new Mock<IAuditService>(MockBehavior.Strict).Object,
            new Mock<IActorContext>(MockBehavior.Strict).Object,
            new Mock<IEffectiveAgentExecutionModeAccessor>(MockBehavior.Strict).Object,
            manifestHash,
            NullLogger<AuthorityRunReadHandlers>.Instance);

        return new(
            readHandlers,
            _export.Object,
            manifestHash,
            scopeProvider.Object,
            _query.Object,
            new Mock<IRunDetailQueryService>(MockBehavior.Strict).Object,
            _gate.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = _principal } },
        };
    }
}
