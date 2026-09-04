using ArchLucid.Application.Authorization;
using ArchLucid.Application;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Drafts;
using ArchLucid.Application.Drafts.Stages;
using ArchLucid.Application.Drafts.QuestionSelection;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Application.Tests.Architecture;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Configuration;
using ArchLucid.Decisioning.Feasibility;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;

using Microsoft.Extensions.Options;

using FluentValidation;

using Moq;

namespace ArchLucid.Application.Tests.Drafts;

/// <summary>Builds the decomposed draft-request service stack for unit tests.</summary>
internal static class DraftRequestServiceTestFactory
{
    public static DraftRequestService Create(
        IDraftRequestRepository repository,
        IDraftAdmissionGate admissionGate,
        IQuestionSelectionEngine questionSelectionEngine,
        IDraftRequestProjector projector,
        IArchitectureRunCommandService architectureRunCommandService,
        IRequestContentSafetyPrecheck contentSafetyPrecheck,
        FeasibilityVerdictBuilder feasibilityVerdictBuilder,
        IPriorPackageSemanticMergeService priorPackageSemanticMergeService,
        IOptionsMonitor<DraftIntakeBranchOptions> branchOptionsMonitor,
        IWorkspaceSystemNameCollisionGuard workspaceSystemNameCollisionGuard,
        IDraftSemanticAdmissionEvaluator semanticAdmissionEvaluator)
    {
        DraftRequestCrudService crudService = new(
            repository,
            new DraftRequestCreateStage(repository, priorPackageSemanticMergeService),
            new DraftRequestMutateStage(repository, questionSelectionEngine, workspaceSystemNameCollisionGuard),
            new DraftRequestDeleteStage(repository, Mock.Of<IWorkOwnershipDeleteAuthorizationService>()));

        DraftAdmissionService admissionService = new(
            repository,
            crudService,
            admissionGate,
            semanticAdmissionEvaluator,
            questionSelectionEngine,
            projector,
            architectureRunCommandService,
            contentSafetyPrecheck,
            feasibilityVerdictBuilder,
            workspaceSystemNameCollisionGuard,
            Mock.Of<IRunRepository>(),
            Mock.Of<IValidator<ArchitectureRequest>>());

        DraftBranchingService branchingService = new(
            repository,
            crudService,
            admissionGate,
            semanticAdmissionEvaluator,
            questionSelectionEngine,
            branchOptionsMonitor);

        DraftSnapshotCloningService snapshotCloningService = new(repository, crudService);

        return new DraftRequestService(crudService, admissionService, branchingService, snapshotCloningService);
    }

    public static DraftRequestService CreateWithDefaults(
        IDraftRequestRepository repository,
        Mock<IEffectiveGovernanceLoader> governanceLoader,
        Mock<IArchitectureRunCommandService> architectureRunCommandService,
        Mock<IRequestContentSafetyPrecheck> contentSafety,
        DraftIntakeBranchOptions branchOptions)
    {
        governanceLoader
            .Setup(static loader => loader.LoadEffectiveContentAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PolicyPackContentDocument());

        contentSafety
            .Setup(static s => s.EvaluateAsync(It.IsAny<ArchitectureRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RequestContentSafetyResult { IsAllowed = true });

        FeasibilityVerdictBuilder verdictBuilder = new(new FeasibilityVerdictValidator());

        return Create(
            repository,
            new DraftAdmissionGate(),
            new QuestionSelectionEngine(governanceLoader.Object),
            new DraftRequestProjector(),
            architectureRunCommandService.Object,
            contentSafety.Object,
            verdictBuilder,
            Mock.Of<IPriorPackageSemanticMergeService>(),
            new FixedDraftIntakeBranchOptionsMonitor(branchOptions),
            WorkspaceSystemNameCollisionGuardTestDoubles.NoOp(),
            new PassThroughDraftSemanticAdmissionEvaluator());
    }
}
