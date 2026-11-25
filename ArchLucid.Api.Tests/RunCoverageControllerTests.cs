using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Api.Models.Coverage;
using ArchLucid.Api.Support;
using ArchLucid.Application;
using ArchLucid.Application.Governance.Coverage;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Governance.Coverage;
using ArchLucid.Core.Persistence.Ports;
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
public sealed class RunCoverageControllerTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    private static readonly Guid RunGuid = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
    private static readonly Guid PolicyPackGuid = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

    private readonly Mock<IRunCoverageAcknowledgementService> _acknowledgementService = new();
    private readonly Mock<IScopeContextProvider> _scopeProvider = new();

    public RunCoverageControllerTests()
    {
        _scopeProvider.Setup(static s => s.GetCurrentScope()).Returns(Scope);
    }

    private RunCoverageController BuildSut() =>
        new(
            Mock.Of<ICoverageQueryService>(),
            _acknowledgementService.Object,
            Mock.Of<IPolicyPackRepository>(),
            _scopeProvider.Object,
            Mock.Of<IAuthorityQueryService>(),
            Mock.Of<IManifestHashService>(),
            Mock.Of<IArchitectureShareAccessGate>())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

    [Theory]
    [InlineData("coverage", false)]
    [InlineData("acknowledgement", false)]
    [InlineData("put", true)]
    [InlineData("patch", true)]
    public async Task Denied_run_access_does_not_reach_manifest_or_coverage_services(string action, bool needsDecide)
    {
        Mock<IAuthorityQueryService> authority = new(MockBehavior.Strict);
        Mock<ICoverageQueryService> coverage = new(MockBehavior.Strict);
        Mock<IPolicyPackRepository> packs = new(MockBehavior.Strict);
        Mock<IArchitectureShareAccessGate> gate = new(MockBehavior.Strict);
        using CancellationTokenSource cancellation = new();
        CancellationToken ct = cancellation.Token;
        RunCoverageController sut = new(
            coverage.Object,
            _acknowledgementService.Object,
            packs.Object,
            _scopeProvider.Object,
            authority.Object,
            Mock.Of<IManifestHashService>(),
            gate.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        NotFoundResult forbidden = new();
        if (needsDecide)
            gate.Setup(g => g.EnsureRunDecideAllowedAsync(sut, sut.User, Scope, RunGuid, ct)).ReturnsAsync(forbidden);
        else
            gate.Setup(g => g.EnsureRunReadAllowedAsync(sut, sut.User, Scope, RunGuid, ct)).ReturnsAsync(forbidden);

        IActionResult result = action switch
        {
            "coverage" => await sut.GetRunCoverage(RunGuid, ct),
            "acknowledgement" => await sut.GetAcknowledgedCoverage(RunGuid, ct),
            "put" => await sut.PutAcknowledgedCoverage(RunGuid, new PutRunCoverageAcknowledgementRequest(), ct),
            "patch" => await sut.PatchRunCoveragePack(RunGuid, PolicyPackGuid, new PatchRunCoveragePackRequest(), ct),
            _ => throw new InvalidOperationException("Unknown coverage action."),
        };

        result.Should().BeSameAs(forbidden);
        if (needsDecide)
            gate.Verify(g => g.EnsureRunDecideAllowedAsync(sut, sut.User, Scope, RunGuid, ct), Times.Once);
        else
            gate.Verify(g => g.EnsureRunReadAllowedAsync(sut, sut.User, Scope, RunGuid, ct), Times.Once);
        gate.VerifyNoOtherCalls();
        authority.VerifyNoOtherCalls();
        coverage.VerifyNoOtherCalls();
        packs.VerifyNoOtherCalls();
        _acknowledgementService.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task PutAcknowledgedCoverage_returns_bad_request_when_entries_collection_contains_null_element()
    {
        RunCoverageController sut = BuildSut();

        IActionResult result = await sut.PutAcknowledgedCoverage(
            RunGuid,
            new PutRunCoverageAcknowledgementRequest
            {
                Entries = new RunCoverageAcknowledgementEntryRequest[] { null! },
            },
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        _acknowledgementService.Verify(
            static s => s.PutAcknowledgementAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<RunAcknowledgedCoverageDocument>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task PutAcknowledgedCoverage_returns_bad_request_when_exclusion_reason_exceeds_max_free_text_length()
    {
        string overLimit = new('x', DraftIntakeValidation.MaximumFreeTextIntentLength + 1);
        RunCoverageController sut = BuildSut();

        IActionResult result = await sut.PutAcknowledgedCoverage(
            RunGuid,
            new PutRunCoverageAcknowledgementRequest
            {
                Entries =
                [
                    new RunCoverageAcknowledgementEntryRequest
                    {
                        PolicyPackId = PolicyPackGuid,
                        Excluded = true,
                        ExclusionReason = overLimit,
                    },
                ],
            },
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        _acknowledgementService.Verify(
            static s => s.PutAcknowledgementAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<RunAcknowledgedCoverageDocument>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task PatchRunCoveragePack_returns_bad_request_when_exclusion_reason_exceeds_max_free_text_length()
    {
        string overLimit = new('x', DraftIntakeValidation.MaximumFreeTextIntentLength + 1);
        RunCoverageController sut = BuildSut();

        IActionResult result = await sut.PatchRunCoveragePack(
            RunGuid,
            PolicyPackGuid,
            new PatchRunCoveragePackRequest
            {
                Excluded = true,
                ExclusionReason = overLimit,
            },
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        _acknowledgementService.Verify(
            static s => s.PatchPackExclusionAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<bool>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task PutAcknowledgedCoverage_returns_bad_request_when_exclusion_reason_contains_invalid_surrogate()
    {
        RunCoverageController sut = BuildSut();

        IActionResult result = await sut.PutAcknowledgedCoverage(
            RunGuid,
            new PutRunCoverageAcknowledgementRequest
            {
                Entries =
                [
                    new RunCoverageAcknowledgementEntryRequest
                    {
                        PolicyPackId = PolicyPackGuid,
                        Excluded = true,
                        ExclusionReason = "\uD800",
                    },
                ],
            },
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        _acknowledgementService.Verify(
            static s => s.PutAcknowledgementAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<RunAcknowledgedCoverageDocument>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task PatchRunCoveragePack_returns_bad_request_when_exclusion_reason_contains_invalid_surrogate()
    {
        RunCoverageController sut = BuildSut();

        IActionResult result = await sut.PatchRunCoveragePack(
            RunGuid,
            PolicyPackGuid,
            new PatchRunCoveragePackRequest
            {
                Excluded = true,
                ExclusionReason = "\uD800",
            },
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        _acknowledgementService.Verify(
            static s => s.PatchPackExclusionAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<bool>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
