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
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Configuration;
using ArchLucid.Decisioning.Feasibility;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Repositories;
using ArchLucid.Persistence.Queries;

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
        IDraftSemanticAdmissionEvaluator semanticAdmissionEvaluator,
        InMemoryRunRepository? runRepository = null,
        InMemoryArchitectureRequestRepository? architectureRequestRepository = null)
    {
        InMemoryRunRepository resolvedRunRepository = runRepository ?? new InMemoryRunRepository();
        InMemoryArchitectureRequestRepository resolvedRequestRepository =
            architectureRequestRepository ?? new InMemoryArchitectureRequestRepository();
        InMemoryArchitectureIdentityRepository architectureIdentityRepository =
            new(repository, resolvedRunRepository);
        ArchitectureIdentityService architectureIdentityService = new(
            architectureIdentityRepository,
            resolvedRunRepository,
            repository);

        PresenterIntakeTrailSyncService presenterIntakeTrailSyncService = new(
            resolvedRunRepository,
            resolvedRequestRepository);

        DraftRequestCrudService crudService = new(
            repository,
            new DraftRequestCreateStage(
                repository,
                priorPackageSemanticMergeService,
                architectureIdentityService),
            new DraftRequestMutateStage(
                repository,
                questionSelectionEngine,
                workspaceSystemNameCollisionGuard,
                architectureIdentityService,
                presenterIntakeTrailSyncService),
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
            resolvedRunRepository,
            Mock.Of<IValidator<ArchitectureRequest>>());

        DraftBranchingService branchingService = new(
            repository,
            crudService,
            admissionGate,
            semanticAdmissionEvaluator,
            questionSelectionEngine,
            branchOptionsMonitor);

        Mock<IAuthorityQueryService> authorityQueryServiceMock = new();
        authorityQueryServiceMock
            .Setup(service => service.GetRunDetailForManifestCompareAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto
            {
                GoldenManifest = new ManifestDocument { ManifestHash = "deadbeef" },
            });

        Mock<IManifestHashService> manifestHashServiceMock = new();
        manifestHashServiceMock
            .Setup(service => service.ComputeHash(It.IsAny<ManifestDocument>()))
            .Returns("deadbeef");

        DraftSnapshotCloningService snapshotCloningService = new(
            repository,
            crudService,
            Mock.Of<IScopeContextProvider>(),
            authorityQueryServiceMock.Object,
            manifestHashServiceMock.Object,
            architectureIdentityService);

        return new DraftRequestService(crudService, admissionService, branchingService, snapshotCloningService);
    }

    public static DraftRequestService CreateWithDefaults(
        IDraftRequestRepository repository,
        Mock<IEffectiveGovernanceLoader> governanceLoader,
        Mock<IArchitectureRunCommandService> architectureRunCommandService,
        Mock<IRequestContentSafetyPrecheck> contentSafety,
        DraftIntakeBranchOptions branchOptions,
        InMemoryRunRepository? runRepository = null,
        InMemoryArchitectureRequestRepository? architectureRequestRepository = null)
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
            new PassThroughDraftSemanticAdmissionEvaluator(),
            runRepository,
            architectureRequestRepository);
    }
}
