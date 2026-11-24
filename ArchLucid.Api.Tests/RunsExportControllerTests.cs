using System.Security.Claims;

using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Api.Support;
using ArchLucid.Application.Exports;
using ArchLucid.Contracts.Exports;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.CareerArtifacts;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.TestSupport.SealedManifest;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RunsExportControllerTests
{
    [Fact]
    public async Task Export_returns_not_found_for_whitespace_run_id_like_GetRun()
    {
        Mock<IArchitectureReviewExportService> exportService = new();
        Mock<IAuditService> auditService = new();
        Mock<IScopeContextProvider> scopeProvider = new();

        RunsExportController controller = new(
            exportService.Object,
            auditService.Object,
            scopeProvider.Object,
            Mock.Of<IAuthorityQueryService>(),
            Mock.Of<IManifestHashService>(),
            AllowedShareGate())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };

        IActionResult action = await controller.Export("   ", "docx", CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        exportService.Verify(
            s => s.GenerateReportAsync(
                It.IsAny<string>(),
                It.IsAny<ExportFormat>(),
                It.IsAny<WhitelabelConfiguration?>(),
                It.IsAny<byte[]?>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Export_returns_409_when_career_export_blocked()
    {
        const string runId = "abc123def4567890abc123def4567890";

        Mock<IArchitectureReviewExportService> exportService = new();
        exportService
            .Setup(s => s.GenerateReportAsync(
                runId,
                ExportFormat.Docx,
                It.IsAny<WhitelabelConfiguration?>(),
                It.IsAny<byte[]?>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new CareerArtifactExportBlockedException(
                SimulatorCareerHonestyPresenter.SimulatorRehearsalBlockedMessage,
                CareerArtifactCompletenessValidator.SimulatorRehearsalCode));

        IAuthorityQueryService authorityQuery =
            SealedManifestHashTestSupport.CreateAuthorityQueryServiceForAnyRun();
        IManifestHashService manifestHashService =
            SealedManifestHashTestSupport.CreateManifestHashService();

        RunsExportController controller = new(
            exportService.Object,
            Mock.Of<IAuditService>(),
            Mock.Of<IScopeContextProvider>(),
            authorityQuery,
            manifestHashService,
            AllowedShareGate())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };

        IActionResult action = await controller.Export(runId, "docx", CancellationToken.None);

        ObjectResult blocked = action.Should().BeOfType<ObjectResult>().Subject;
        blocked.StatusCode.Should().Be(StatusCodes.Status409Conflict);
    }

    [Theory]
    [InlineData("N")]
    [InlineData("D")]
    public async Task Restricted_architecture_run_export_does_not_reach_authority_or_generator(string format)
    {
        Guid runId = Guid.Parse("aaaa1111-bbbb-2222-cccc-3333dddd4444");
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        Mock<IScopeContextProvider> scopes = new(MockBehavior.Strict);
        scopes.Setup(s => s.GetCurrentScope()).Returns(scope);
        Mock<IArchitectureShareAccessGate> sharing = new(MockBehavior.Strict);
        sharing.Setup(g => g.EnsureRunReadAllowedAsync(
                It.IsAny<ControllerBase>(),
                It.IsAny<ClaimsPrincipal>(),
                scope,
                runId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new NotFoundResult());

        Mock<IArchitectureReviewExportService> exports = new(MockBehavior.Strict);
        Mock<IAuthorityQueryService> authority = new(MockBehavior.Strict);
        Mock<IAuditService> audit = new(MockBehavior.Strict);
        RunsExportController controller = new(
            exports.Object, audit.Object, scopes.Object,
            authority.Object, Mock.Of<IManifestHashService>(), sharing.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };

        IActionResult result = await controller.Export(
            runId.ToString(format), "docx", CancellationToken.None);

        result.Should().BeOfType<NotFoundResult>();
        sharing.Verify(g => g.EnsureRunReadAllowedAsync(
                It.IsAny<ControllerBase>(), It.IsAny<ClaimsPrincipal>(),
                scope, runId, It.IsAny<CancellationToken>()), Times.Once);
        authority.VerifyNoOtherCalls();
        exports.VerifyNoOtherCalls();
        audit.VerifyNoOtherCalls();
    }

    private static IArchitectureShareAccessGate AllowedShareGate()
    {
        Mock<IArchitectureShareAccessGate> gate = new();
        gate.Setup(g => g.EnsureRunReadAllowedAsync(
                It.IsAny<ControllerBase>(),
                It.IsAny<ClaimsPrincipal>(),
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((IActionResult?)null);
        return gate.Object;
    }

}
