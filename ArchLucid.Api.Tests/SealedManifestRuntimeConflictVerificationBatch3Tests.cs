using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Api.Controllers.Pilots;
using ArchLucid.Api.Models.Pilots;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Common;
using ArchLucid.Application.Findings;
using ArchLucid.Application.Pilots;
using ArchLucid.Application.Runs.Query;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Feedback;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.TestSupport.SealedManifest;

using FluentAssertions;

using FluentValidation;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;

using Moq;

using MvcProblemDetails = Microsoft.AspNetCore.Mvc.ProblemDetails;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Batch-3 proof tests: architecture request curation, run pin, and pilot closeout map repository/service
///     <see cref="ConflictException" /> to OpenAPI **409**.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class SealedManifestRuntimeConflictVerificationBatch3Tests
{
    private const string SealedConflictMessage =
        "Sealed-manifest hash drift blocks this architecture review mutation.";

    private const string RequestId = "REQ-100";

    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    private static readonly Guid RunId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    private static readonly ConflictException SealedConflict = new(SealedConflictMessage);

    private static void AssertSealedManifestConflict409(IActionResult action)
    {
        ObjectResult conflict = action.Should().BeOfType<ObjectResult>().Subject;
        conflict.StatusCode.Should().Be(StatusCodes.Status409Conflict);
        MvcProblemDetails problem = conflict.Value.Should().BeOfType<MvcProblemDetails>().Subject;
        problem.Type.Should().Be(ProblemTypes.Conflict);
        problem.Detail.Should().Be(SealedConflictMessage);
    }

    private static (
        RunsController Controller,
        Mock<IArchitectureRequestRepository> Requests,
        Mock<IAuditService> Audit) BuildArchitectureRequestController()
    {
        ArchitectureRequest request = new() { RequestId = RequestId, SystemName = "Core" };

        Mock<IArchitectureRequestRepository> requests = new();
        requests
            .Setup(r => r.GetByIdAsync(RequestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(request);

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.ExistsRunForArchitectureRequestInScopeAsync(
                Scope,
                RequestId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<IAuditService> audit = new();

        RunsController controller = new(
            Mock.Of<IRunLifecycleCommandService>(),
            Mock.Of<IArchitectureApplicationService>(),
            Mock.Of<IValidator<ArchitectureRequest>>(),
            BuildScopeProvider(),
            BuildActorContext(),
            audit.Object,
            SealedManifestHashTestSupport.CreateAuthorityQueryServiceForAnyRun(),
            Mock.Of<IFindingFeedbackRepository>(),
            new FindingInstrumentationAuditSupport(
                audit.Object,
                NullLogger<FindingInstrumentationAuditSupport>.Instance),
            runs.Object,
            SealedManifestHashTestSupport.CreateRunDetailQueryServiceWithoutCommittedRuns(),
            SealedManifestHashTestSupport.CreateManifestHashService(),
            NullLogger<RunsController>.Instance)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        return (controller, requests, audit);
    }

    private static RunsController BuildPinRunController(Mock<IRunRepository> runs, Mock<IAuditService> audit)
    {
        return new RunsController(
            Mock.Of<IRunLifecycleCommandService>(),
            Mock.Of<IArchitectureApplicationService>(),
            Mock.Of<IValidator<ArchitectureRequest>>(),
            BuildScopeProvider(),
            BuildActorContext(),
            audit.Object,
            SealedManifestHashTestSupport.CreateAuthorityQueryServiceForAnyRun(),
            Mock.Of<IFindingFeedbackRepository>(),
            new FindingInstrumentationAuditSupport(
                audit.Object,
                NullLogger<FindingInstrumentationAuditSupport>.Instance),
            runs.Object,
            SealedManifestHashTestSupport.CreateRunDetailQueryServiceWithoutCommittedRuns(),
            SealedManifestHashTestSupport.CreateManifestHashService(),
            NullLogger<RunsController>.Instance)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };
    }

    private static PilotsController BuildPilotsController(Mock<IPilotsApplicationService> pilots)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(static s => s.GetCurrentScope()).Returns(Scope);

        return new PilotsController(
            pilots.Object,
            scopeProvider.Object,
            SealedManifestHashTestSupport.CreateAuthorityQueryServiceForAnyRun(),
            SealedManifestHashTestSupport.CreateRunDetailQueryServiceWithoutCommittedRuns(),
            SealedManifestHashTestSupport.CreateManifestHashService())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };
    }

    private static IScopeContextProvider BuildScopeProvider()
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(static s => s.GetCurrentScope()).Returns(Scope);

        return scopeProvider.Object;
    }

    private static IActorContext BuildActorContext()
    {
        Mock<IActorContext> actor = new();
        actor.Setup(static a => a.GetActor()).Returns("operator@test");

        return actor.Object;
    }

    [Fact]
    public async Task ArchiveRequest_maps_repository_ConflictException_to_409_and_does_not_audit()
    {
        (RunsController sut, Mock<IArchitectureRequestRepository> requests, Mock<IAuditService> audit) =
            BuildArchitectureRequestController();
        requests
            .Setup(r => r.ArchiveAsync(RequestId, It.IsAny<CancellationToken>()))
            .ThrowsAsync(SealedConflict);

        IActionResult action = await sut.ArchiveRequest(
            RequestId,
            requests.Object,
            SealedManifestHashTestSupport.CreateManifestHashService(),
            CancellationToken.None);

        AssertSealedManifestConflict409(action);
        audit.Verify(
            static a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task DeleteRequest_maps_repository_ConflictException_to_409_and_does_not_audit()
    {
        (RunsController sut, Mock<IArchitectureRequestRepository> requests, Mock<IAuditService> audit) =
            BuildArchitectureRequestController();
        requests
            .Setup(r => r.ArchiveAsync(RequestId, It.IsAny<CancellationToken>()))
            .ThrowsAsync(SealedConflict);

        IActionResult action = await sut.DeleteRequest(
            RequestId,
            requests.Object,
            SealedManifestHashTestSupport.CreateManifestHashService(),
            CancellationToken.None);

        AssertSealedManifestConflict409(action);
        audit.Verify(
            static a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task RestoreRequest_maps_repository_ConflictException_to_409_and_does_not_audit()
    {
        ArchitectureRequest archived = new() { RequestId = RequestId, SystemName = "Core", IsArchived = true };

        Mock<IArchitectureRequestRepository> requests = new();
        requests
            .Setup(r => r.GetByIdAsync(RequestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(archived);
        requests
            .Setup(r => r.RestoreAsync(RequestId, It.IsAny<CancellationToken>()))
            .ThrowsAsync(SealedConflict);

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.ExistsRunForArchitectureRequestInScopeAsync(
                Scope,
                RequestId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<IAuditService> audit = new();
        RunsController sut = BuildPinRunController(runs, audit);

        IActionResult action = await sut.RestoreRequest(
            RequestId,
            requests.Object,
            SealedManifestHashTestSupport.CreateManifestHashService(),
            CancellationToken.None);

        AssertSealedManifestConflict409(action);
        audit.Verify(
            static a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task PinRun_maps_repository_ConflictException_to_409_and_does_not_audit()
    {
        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = RunId, IsPinned = false });
        runs
            .Setup(r => r.UpdateAsync(It.IsAny<RunRecord>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(SealedConflict);

        Mock<IAuditService> audit = new();
        RunsController sut = BuildPinRunController(runs, audit);

        IActionResult action = await sut.PinRun(RunId.ToString("D"), null, CancellationToken.None);

        AssertSealedManifestConflict409(action);
        audit.Verify(
            static a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task PostCloseout_maps_service_ConflictException_to_409()
    {
        Mock<IPilotsApplicationService> pilots = new(MockBehavior.Strict);
        pilots
            .Setup(s => s.CreateCloseoutAsync(
                RunId.ToString("D"),
                It.IsAny<decimal?>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(SealedConflict);
        PilotsController sut = BuildPilotsController(pilots);

        IActionResult action = await sut.PostCloseout(
            new PilotCloseoutPostRequest
            {
                RunId = RunId.ToString("D"),
                SpeedScore = 4,
                ManifestPackageScore = 4,
                TraceabilityScore = 4,
            },
            CancellationToken.None);

        AssertSealedManifestConflict409(action);
    }
}
