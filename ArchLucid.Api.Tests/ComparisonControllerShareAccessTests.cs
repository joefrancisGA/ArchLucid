using System.Security.Claims;

using ArchLucid.Api.Controllers.Planning;
using ArchLucid.Api.Support;
using ArchLucid.Application.Analysis;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ComparisonControllerShareAccessTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task CompareRuns_denied_share_prevents_all_payload_reads(bool denyTarget)
    {
        Guid baseRunId = Guid.NewGuid();
        Guid targetRunId = Guid.NewGuid();
        using CancellationTokenSource cancellation = new();
        CancellationToken ct = cancellation.Token;
        Mock<ICompareRunsApplicationFacade> facade = new(MockBehavior.Strict);
        Mock<IAuthorityQueryService> authority = new(MockBehavior.Strict);
        Mock<IArchitectureShareAccessGate> gate = new(MockBehavior.Strict);
        NotFoundResult denial = new();

        gate.Setup(g => g.EnsureRunReadAllowedAsync(
                It.IsAny<ControllerBase>(), It.IsAny<ClaimsPrincipal>(), Scope, baseRunId, ct))
            .ReturnsAsync(denyTarget ? (IActionResult?)null : denial);
        if (denyTarget)
        {
            gate.Setup(g => g.EnsureRunReadAllowedAsync(
                    It.IsAny<ControllerBase>(), It.IsAny<ClaimsPrincipal>(), Scope, targetRunId, ct))
                .ReturnsAsync((IActionResult?)denial);
        }

        ComparisonController controller = CreateController(facade.Object, authority.Object, gate.Object);

        IActionResult result = await controller.CompareRuns(baseRunId, targetRunId, ct);

        result.Should().BeSameAs(denial);
        gate.Verify(g => g.EnsureRunReadAllowedAsync(controller, controller.User, Scope, baseRunId, ct), Times.Once);
        if (denyTarget)
            gate.Verify(g => g.EnsureRunReadAllowedAsync(controller, controller.User, Scope, targetRunId, ct), Times.Once);
        gate.VerifyNoOtherCalls();
        authority.VerifyNoOtherCalls();
        facade.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task CompareRuns_authorizes_both_before_existing_compare_path()
    {
        Guid baseRunId = Guid.NewGuid();
        Guid targetRunId = Guid.NewGuid();
        using CancellationTokenSource cancellation = new();
        CancellationToken ct = cancellation.Token;
        Mock<ICompareRunsApplicationFacade> facade = new(MockBehavior.Strict);
        Mock<IAuthorityQueryService> authority = new(MockBehavior.Strict);
        Mock<IArchitectureShareAccessGate> gate = new(MockBehavior.Strict);
        MockSequence sequence = new();
        gate.InSequence(sequence).Setup(g => g.EnsureRunReadAllowedAsync(
                It.IsAny<ControllerBase>(), It.IsAny<ClaimsPrincipal>(), Scope, baseRunId, ct))
            .ReturnsAsync((IActionResult?)null);
        gate.InSequence(sequence).Setup(g => g.EnsureRunReadAllowedAsync(
                It.IsAny<ControllerBase>(), It.IsAny<ClaimsPrincipal>(), Scope, targetRunId, ct))
            .ReturnsAsync((IActionResult?)null);
        authority.InSequence(sequence).Setup(q => q.GetRunDetailAsync(Scope, baseRunId, ct))
            .ReturnsAsync((RunDetailDto?)null);
        authority.InSequence(sequence).Setup(q => q.GetRunDetailAsync(Scope, targetRunId, ct))
            .ReturnsAsync((RunDetailDto?)null);
        facade.InSequence(sequence).Setup(f => f.CompareManifestsAsync(baseRunId, targetRunId, ct))
            .ReturnsAsync(new ManifestCompareLoadResult
            {
                Outcome = ManifestCompareLoadOutcome.TargetManifestNotFound,
                RunId = targetRunId,
            });

        ComparisonController controller = CreateController(facade.Object, authority.Object, gate.Object);
        IActionResult result = await controller.CompareRuns(baseRunId, targetRunId, ct);

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    private static ComparisonController CreateController(
        ICompareRunsApplicationFacade facade,
        IAuthorityQueryService authority,
        IArchitectureShareAccessGate gate)
    {
        Mock<IScopeContextProvider> scope = new(MockBehavior.Strict);
        scope.Setup(s => s.GetCurrentScope()).Returns(Scope);
        return new ComparisonController(facade, authority, scope.Object, Mock.Of<IManifestHashService>(), gate)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };
    }
}
