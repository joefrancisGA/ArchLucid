using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Api.Models.Coverage;
using ArchLucid.Application;
using ArchLucid.Application.Governance.Coverage;
using ArchLucid.Contracts.Governance.Coverage;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;
using ArchLucid.TestSupport.SealedManifest;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RunCoverageControllerAcknowledgementTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task PutAcknowledgedCoverage_returns_bad_request_when_request_body_null()
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(static s => s.GetCurrentScope()).Returns(Scope);

        Mock<IRunCoverageAcknowledgementService> acknowledgementService = new();

        RunCoverageController sut = new(
            Mock.Of<ICoverageQueryService>(),
            acknowledgementService.Object,
            Mock.Of<ArchLucid.Core.Persistence.Ports.IPolicyPackRepository>(),
            scopeProvider.Object,
            Mock.Of<IAuthorityQueryService>(),
            Mock.Of<IManifestHashService>())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        IActionResult result = await sut.PutAcknowledgedCoverage(runId, null, CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        acknowledgementService.Verify(
            static s => s.PutAcknowledgementAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<RunAcknowledgedCoverageDocument>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task GetAcknowledgedCoverage_returns_not_found_when_run_does_not_exist()
    {
        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(static s => s.GetCurrentScope()).Returns(Scope);

        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(q => q.GetRunDetailAsync(
                It.IsAny<ScopeContext>(),
                runId,
                It.IsAny<CancellationToken>(),
                It.IsAny<bool>()))
            .ReturnsAsync((RunDetailDto?)null);

        Mock<IRunCoverageAcknowledgementService> acknowledgementService = new();
        acknowledgementService
            .Setup(s => s.GetAsync(Scope, runId, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new RunNotFoundException(runId.ToString("N")));

        RunCoverageController sut = new(
            Mock.Of<ICoverageQueryService>(),
            acknowledgementService.Object,
            Mock.Of<ArchLucid.Core.Persistence.Ports.IPolicyPackRepository>(),
            scopeProvider.Object,
            authority.Object,
            SealedManifestHashTestSupport.CreateManifestHashService())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IActionResult result = await sut.GetAcknowledgedCoverage(runId, CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task PatchRunCoveragePack_returns_bad_request_when_excluded_true_with_empty_exclusion_reason()
    {
        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        Guid policyPackId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(static s => s.GetCurrentScope()).Returns(Scope);

        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(q => q.GetRunDetailAsync(
                It.IsAny<ScopeContext>(),
                runId,
                It.IsAny<CancellationToken>(),
                It.IsAny<bool>()))
            .ReturnsAsync((RunDetailDto?)null);

        Mock<IRunCoverageAcknowledgementService> acknowledgementService = new();
        acknowledgementService
            .Setup(s => s.PatchPackExclusionAsync(
                Scope,
                runId,
                policyPackId,
                true,
                string.Empty,
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new ArgumentException(
                "ExclusionReason is required when excluded is true.",
                nameof(PatchRunCoveragePackRequest.ExclusionReason)));

        RunCoverageController sut = new(
            Mock.Of<ICoverageQueryService>(),
            acknowledgementService.Object,
            Mock.Of<ArchLucid.Core.Persistence.Ports.IPolicyPackRepository>(),
            scopeProvider.Object,
            authority.Object,
            SealedManifestHashTestSupport.CreateManifestHashService())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IActionResult result = await sut.PatchRunCoveragePack(
            runId,
            policyPackId,
            new PatchRunCoveragePackRequest { Excluded = true, ExclusionReason = string.Empty },
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task PatchRunCoveragePack_returns_bad_request_when_excluded_true_with_whitespace_only_exclusion_reason()
    {
        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        Guid policyPackId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(static s => s.GetCurrentScope()).Returns(Scope);

        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(q => q.GetRunDetailAsync(
                It.IsAny<ScopeContext>(),
                runId,
                It.IsAny<CancellationToken>(),
                It.IsAny<bool>()))
            .ReturnsAsync((RunDetailDto?)null);

        Mock<IRunCoverageAcknowledgementService> acknowledgementService = new();
        acknowledgementService
            .Setup(s => s.PatchPackExclusionAsync(
                Scope,
                runId,
                policyPackId,
                true,
                "   ",
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new ArgumentException(
                "ExclusionReason is required when excluded is true.",
                nameof(PatchRunCoveragePackRequest.ExclusionReason)));

        RunCoverageController sut = new(
            Mock.Of<ICoverageQueryService>(),
            acknowledgementService.Object,
            Mock.Of<ArchLucid.Core.Persistence.Ports.IPolicyPackRepository>(),
            scopeProvider.Object,
            authority.Object,
            SealedManifestHashTestSupport.CreateManifestHashService())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IActionResult result = await sut.PatchRunCoveragePack(
            runId,
            policyPackId,
            new PatchRunCoveragePackRequest { Excluded = true, ExclusionReason = "   " },
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task PutAcknowledgedCoverage_returns_bad_request_when_excluded_entry_has_empty_exclusion_reason()
    {
        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        Guid policyPackId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(static s => s.GetCurrentScope()).Returns(Scope);

        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(q => q.GetRunDetailAsync(
                It.IsAny<ScopeContext>(),
                runId,
                It.IsAny<CancellationToken>(),
                It.IsAny<bool>()))
            .ReturnsAsync((RunDetailDto?)null);

        Mock<IRunCoverageAcknowledgementService> acknowledgementService = new();
        acknowledgementService
            .Setup(s => s.PutAcknowledgementAsync(
                Scope,
                runId,
                It.Is<RunAcknowledgedCoverageDocument>(d =>
                    d.Entries.Count == 1
                    && d.Entries[0].Excluded
                    && d.Entries[0].ExclusionReason == string.Empty),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new ArgumentException(
                "ExclusionReason is required when excluded is true.",
                nameof(RunCoverageAcknowledgementEntry.ExclusionReason)));

        RunCoverageController sut = new(
            Mock.Of<ICoverageQueryService>(),
            acknowledgementService.Object,
            Mock.Of<ArchLucid.Core.Persistence.Ports.IPolicyPackRepository>(),
            scopeProvider.Object,
            authority.Object,
            SealedManifestHashTestSupport.CreateManifestHashService())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IActionResult result = await sut.PutAcknowledgedCoverage(
            runId,
            new PutRunCoverageAcknowledgementRequest
            {
                Entries =
                [
                    new RunCoverageAcknowledgementEntryRequest
                    {
                        PolicyPackId = policyPackId,
                        Excluded = true,
                        ExclusionReason = string.Empty,
                    },
                ],
            },
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }
}
