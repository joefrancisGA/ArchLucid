using ArchLucid.Application.Architecture;
using ArchLucid.Application.Common;
using ArchLucid.Application.Tests.Architecture;
using ArchLucid.Application.Governance.DefaultPolicyPacks;
using ArchLucid.Application.Runs.Coordination;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authority;
using ArchLucid.Core.Concurrency;
using ArchLucid.Core.Metering;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Transactions;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Governance;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.TestSupport;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Orchestration;

internal static class ArchitectureRunCreateOrchestratorTestSupport
{
    internal static DefaultPolicyPackCloudBaselineApplicator CreatePolicyPackCloudBaselineApplicator() =>
        new(
            new InMemoryPolicyPackRepository(),
            new InMemoryPolicyPackAssignmentRepository(),
            NullLogger<DefaultPolicyPackCloudBaselineApplicator>.Instance);

    internal static ArchitectureRunCreateOrchestrator CreateOrchestrator(
        IArchitectureRunAuthorityCoordination coordination,
        IArchitectureRequestRepository? requestRepository = null,
        IRunRepository? runRepository = null,
        IScopeContextProvider? scopeContextProvider = null,
        IEvidenceBundleRepository? evidenceBundleRepository = null,
        IAgentTaskRepository? taskRepository = null,
        IArchitectureRunIdempotencyRepository? architectureRunIdempotencyRepository = null,
        IActorContext? actorContext = null,
        IBaselineMutationAuditService? baselineMutationAudit = null,
        IArchLucidUnitOfWorkFactory? unitOfWorkFactory = null,
        IDistributedCreateRunIdempotencyLock? distributedCreateRunIdempotencyLock = null,
        IOptions<ArchitectureRunCreateOptions>? createRunOptions = null,
        IAsyncAuthorityPipelineModeResolver? asyncAuthorityPipelineModeResolver = null,
        IRunStateTransitionService? runStateTransitionService = null,
        IRequestContentSafetyPrecheck? requestContentSafetyPrecheck = null,
        IWorkspaceSystemNameCollisionGuard? workspaceSystemNameCollisionGuard = null,
        IAuditService? auditService = null,
        IUsageMeteringService? usageMetering = null,
        TimeProvider? timeProvider = null,
        IArchitectureIdentityService? architectureIdentityService = null)
    {
        IArchitectureRequestRepository requestRepo = requestRepository ?? Mock.Of<IArchitectureRequestRepository>();
        IRunRepository runRepo = runRepository ?? Mock.Of<IRunRepository>();
        IScopeContextProvider scopeProvider = scopeContextProvider ?? Mock.Of<IScopeContextProvider>();
        IEvidenceBundleRepository evidenceRepo = evidenceBundleRepository ?? Mock.Of<IEvidenceBundleRepository>();
        IAgentTaskRepository taskRepo = taskRepository ?? Mock.Of<IAgentTaskRepository>();
        IArchitectureRunIdempotencyRepository idempotencyRepo =
            architectureRunIdempotencyRepository ?? Mock.Of<IArchitectureRunIdempotencyRepository>();
        IRunStateTransitionService runStateTransition = runStateTransitionService ?? Mock.Of<IRunStateTransitionService>();

        ArchitectureRunCreateIdempotencyHelper idempotencyHelper = new(
            idempotencyRepo,
            runRepo,
            scopeProvider,
            taskRepo,
            evidenceRepo,
            NullLogger<ArchitectureRunCreateIdempotencyHelper>.Instance);

        ArchitectureRunCreatePersistenceHelper persistenceHelper = new(
            requestRepo,
            evidenceRepo,
            taskRepo,
            idempotencyRepo,
            runRepo,
            scopeProvider,
            runStateTransition,
            NullLogger<ArchitectureRunCreatePersistenceHelper>.Instance);

        return new ArchitectureRunCreateOrchestrator(
            coordination,
            requestRepo,
            runRepo,
            scopeProvider,
            evidenceRepo,
            taskRepo,
            idempotencyRepo,
            actorContext ?? Mock.Of<IActorContext>(),
            baselineMutationAudit ?? Mock.Of<IBaselineMutationAuditService>(),
            unitOfWorkFactory ?? ArchLucidUnitOfWorkTestDoubles.InMemoryModeFactory(),
            distributedCreateRunIdempotencyLock ?? new InProcessCreateRunIdempotencyLock(),
            createRunOptions ?? Options.Create(new ArchitectureRunCreateOptions()),
            asyncAuthorityPipelineModeResolver ?? new DisabledAsyncAuthorityPipelineModeResolver(),
            runStateTransition,
            requestContentSafetyPrecheck ?? new DefaultRequestContentSafetyPrecheck(),
            workspaceSystemNameCollisionGuard ?? WorkspaceSystemNameCollisionGuardTestDoubles.NoOp(),
            idempotencyHelper,
            persistenceHelper,
            auditService ?? Mock.Of<IAuditService>(),
            usageMetering ?? Mock.Of<IUsageMeteringService>(),
            timeProvider ?? TimeProvider.System,
            CreatePolicyPackCloudBaselineApplicator(),
            architectureIdentityService ?? Mock.Of<IArchitectureIdentityService>(),
            NullLogger<ArchitectureRunCreateOrchestrator>.Instance);
    }
}
