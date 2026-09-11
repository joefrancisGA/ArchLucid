using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Common;
using ArchLucid.Application.Findings;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Application.Runs.Query;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Feedback;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Queries;
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
///     TB-2321 runtime proof: finalize scorecard <see cref="ConflictException" /> maps to OpenAPI **409**
///     on <c>POST /v1/architecture/review/{runId}/finalize</c> (controller-level, no SQL integration).
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class FinalizeQualityGateRuntimeConflictTests
{
    private const string RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    private static readonly ConflictException ScorecardConflict = new(
        FinalizeQualityGate.BlockedPrefix
        + "1 open verify-hypothesis finding still need a recorded hypothesis outcome before finalize.");

    [Fact]
    public async Task CommitRun_maps_finalize_quality_scorecard_ConflictException_to_409()
    {
        Mock<IRunLifecycleCommandService> commands = new(MockBehavior.Strict);
        commands
            .Setup(s => s.CommitRunAsync(
                Scope,
                RunId,
                It.IsAny<CommitRunRequest>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(ScorecardConflict);

        RunsController controller = CreateController(commands.Object);

        IActionResult action = await controller.CommitRun(RunId, null, CancellationToken.None);

        ObjectResult conflict = action.Should().BeOfType<ObjectResult>().Subject;
        conflict.StatusCode.Should().Be(StatusCodes.Status409Conflict);

        MvcProblemDetails problem = conflict.Value.Should().BeOfType<MvcProblemDetails>().Subject;
        problem.Type.Should().Be(ProblemTypes.Conflict);
        problem.Detail.Should().Be(ScorecardConflict.Message);
        problem.Detail.Should().StartWith(FinalizeQualityGate.BlockedPrefix);
    }

    private static RunsController CreateController(IRunLifecycleCommandService runLifecycleCommandService)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActor()).Returns("operator@test");

        Mock<IValidator<ArchitectureRequest>> validator = new();
        validator
            .Setup(v => v.ValidateAsync(It.IsAny<ArchitectureRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new FluentValidation.Results.ValidationResult());

        return new RunsController(
            runLifecycleCommandService,
            Mock.Of<IArchitectureApplicationService>(),
            validator.Object,
            scopeProvider.Object,
            actor.Object,
            Mock.Of<IAuditService>(),
            SealedManifestHashTestSupport.CreateAuthorityQueryServiceForAnyRun(),
            Mock.Of<IFindingFeedbackRepository>(),
            new FindingInstrumentationAuditSupport(
                Mock.Of<IAuditService>(),
                NullLogger<FindingInstrumentationAuditSupport>.Instance),
            Mock.Of<IRunRepository>(),
            SealedManifestHashTestSupport.CreateRunDetailQueryServiceWithoutCommittedRuns(),
            SealedManifestHashTestSupport.CreateManifestHashService(),
            NullLogger<RunsController>.Instance)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };
    }
}
