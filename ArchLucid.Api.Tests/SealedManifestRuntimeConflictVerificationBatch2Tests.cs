using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Api.Controllers.Pilots;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Common;
using ArchLucid.Application.Findings;
using ArchLucid.Application.Governance.Workflow;
using ArchLucid.Application.Pilots;
using ArchLucid.Application.Runs.Query;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Pilots;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Feedback;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
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
///     Batch-2 proof tests: governance promotions, run mutations, and pilot delta reads map
///     service-thrown <see cref="ConflictException" /> to OpenAPI **409**.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class SealedManifestRuntimeConflictVerificationBatch2Tests
{
    private const string SealedConflictMessage =
        "Sealed-manifest hash drift blocks this architecture review mutation.";

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

    private static ArchitectureRequest SampleArchitectureRequest() =>
        new()
        {
            RequestId = "REQ-BATCH-1",
            Description =
                "Design a secure Azure RAG system for enterprise internal documents using Azure AI Search, managed identity, private endpoints, SQL metadata storage, and moderate cost sensitivity.",
            SystemName = "EnterpriseRag",
            Environment = "prod",
            CloudProvider = CloudProvider.Azure,
            Constraints = ["Private endpoints required"],
            RequiredCapabilities = ["Azure AI Search"],
        };

    private static RunsController BuildRunsController(
        IArchitectureApplicationService? architectureApplicationService = null,
        IRunLifecycleCommandService? runLifecycleCommandService = null)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(static s => s.GetCurrentScope()).Returns(Scope);

        Mock<IActorContext> actor = new();
        actor.Setup(static a => a.GetActor()).Returns("operator@test");

        return new RunsController(
            runLifecycleCommandService ?? Mock.Of<IRunLifecycleCommandService>(),
            architectureApplicationService ?? Mock.Of<IArchitectureApplicationService>(),
            Mock.Of<IValidator<ArchitectureRequest>>(),
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

    private static ITenantRepository TenantExistsRepository()
    {
        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(repository => repository.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Id = Scope.TenantId, Name = "contoso" });
        tenants
            .Setup(repository => repository.ListWorkspacesAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new TenantWorkspaceListItem
                {
                    TenantId = Scope.TenantId,
                    WorkspaceId = Scope.WorkspaceId,
                    Name = "primary",
                },
            ]);

        return tenants.Object;
    }

    private static GovernanceController BuildGovernanceController(Mock<IGovernanceWorkflowFacade> workflow)
    {
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(static s => s.GetCurrentScope()).Returns(Scope);

        Mock<IActorContext> actor = new();
        actor.Setup(static a => a.GetActor()).Returns("governance-operator");
        actor.Setup(static a => a.GetActorId()).Returns("gov-op-id");

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = RunId });

        return GovernanceControllerTestFactory.Create(
            workflowFacade: workflow.Object,
            actorContext: actor.Object,
            scopeContextProvider: scope.Object,
            runRepository: runs.Object,
            tenantRepository: TenantExistsRepository());
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

    [Fact]
    public async Task SubmitAgentResult_maps_service_ConflictException_to_409()
    {
        Mock<IArchitectureApplicationService> app = new(MockBehavior.Strict);
        app
            .Setup(s => s.SubmitAgentResultAsync(
                RunId.ToString("D"),
                It.IsAny<AgentResult>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(SealedConflict);
        RunsController sut = BuildRunsController(architectureApplicationService: app.Object);

        SubmitAgentResultRequest body = new()
        {
            Result = new AgentResult { AgentType = AgentType.Topology },
        };

        IActionResult action = await sut.SubmitAgentResult(RunId.ToString("D"), body, CancellationToken.None);

        AssertSealedManifestConflict409(action);
    }

    [Fact]
    public async Task CreateRunBatch_maps_service_ConflictException_to_409()
    {
        Mock<IRunLifecycleCommandService> commands = new(MockBehavior.Strict);
        commands
            .Setup(s => s.ValidateIdempotencyKey(It.IsAny<string>()))
            .Returns(new IdempotencyKeyValidationResult(true, "batch-idem-1", null));
        commands
            .Setup(s => s.CreateRunBatchAsync(
                Scope,
                It.IsAny<IReadOnlyList<ArchitectureRequest>>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(SealedConflict);
        RunsController sut = BuildRunsController(runLifecycleCommandService: commands.Object);
        sut.ControllerContext.HttpContext.Request.Headers["Idempotency-Key"] = "batch-idem-1";

        IActionResult action = await sut.CreateRunBatch([SampleArchitectureRequest()], CancellationToken.None);

        AssertSealedManifestConflict409(action);
    }

    [Fact]
    public async Task Promote_maps_service_ConflictException_to_409()
    {
        Mock<IGovernanceWorkflowFacade> workflow = new(MockBehavior.Strict);
        workflow
            .Setup(w => w.PromoteAsync(
                RunId.ToString("D"),
                "1",
                "dev",
                "test",
                It.IsAny<string>(),
                null,
                null,
                true,
                false,
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(SealedConflict);
        GovernanceController sut = BuildGovernanceController(workflow);

        IActionResult action = await sut.Promote(
            new CreateGovernancePromotionRequest
            {
                RunId = RunId.ToString("D"),
                ManifestVersion = "1",
                SourceEnvironment = "dev",
                TargetEnvironment = "test",
            },
            dryRun: true,
            CancellationToken.None);

        AssertSealedManifestConflict409(action);
    }

    [Fact]
    public async Task Activate_maps_service_ConflictException_to_409()
    {
        Mock<IGovernanceWorkflowFacade> workflow = new(MockBehavior.Strict);
        workflow
            .Setup(w => w.ActivateAsync(
                RunId.ToString("D"),
                "1",
                "dev",
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(SealedConflict);
        GovernanceController sut = BuildGovernanceController(workflow);
        sut.ControllerContext.HttpContext.Request.Headers["Idempotency-Key"] = "activate-idem-1";

        IActionResult action = await sut.Activate(
            new CreateGovernanceActivationRequest
            {
                RunId = RunId.ToString("D"),
                ManifestVersion = "1",
                Environment = "dev",
            },
            CancellationToken.None);

        AssertSealedManifestConflict409(action);
    }

    [Fact]
    public async Task SubmitApprovalRequest_maps_service_ConflictException_to_409()
    {
        Mock<IGovernanceWorkflowFacade> workflow = new(MockBehavior.Strict);
        workflow
            .Setup(w => w.SubmitApprovalRequestAsync(
                RunId.ToString("D"),
                "1",
                "dev",
                "test",
                It.IsAny<string>(),
                It.IsAny<string>(),
                null,
                true,
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(SealedConflict);
        GovernanceController sut = BuildGovernanceController(workflow);

        IActionResult action = await sut.SubmitApprovalRequest(
            new CreateGovernanceApprovalRequest
            {
                RunId = RunId.ToString("D"),
                ManifestVersion = "1",
                SourceEnvironment = "dev",
                TargetEnvironment = "test",
            },
            dryRun: true,
            CancellationToken.None);

        AssertSealedManifestConflict409(action);
    }

    [Fact]
    public async Task GetPilotRunDeltas_maps_service_ConflictException_to_409()
    {
        Mock<IPilotsApplicationService> pilots = new(MockBehavior.Strict);
        pilots
            .Setup(s => s.TryGetPilotRunDeltasAsync(RunId.ToString("D"), It.IsAny<CancellationToken>()))
            .ThrowsAsync(SealedConflict);
        PilotsController sut = BuildPilotsController(pilots);

        IActionResult action = await sut.GetPilotRunDeltas(RunId.ToString("D"), CancellationToken.None);

        AssertSealedManifestConflict409(action);
    }

    [Fact]
    public async Task GetRecentDeltas_maps_service_ConflictException_to_409()
    {
        Mock<IPilotsApplicationService> pilots = new(MockBehavior.Strict);
        pilots
            .Setup(s => s.GetRecentDeltasAsync(It.IsAny<int?>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(SealedConflict);
        PilotsController sut = BuildPilotsController(pilots);

        IActionResult action = await sut.GetRecentDeltas(count: 5, CancellationToken.None);

        AssertSealedManifestConflict409(action);
    }
}
